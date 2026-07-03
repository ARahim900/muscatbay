-- ═══════════════════════════════════════════════════════════════════════
-- Water Monthly — automatic sync, writable compat view & live updates
--
-- Problem this solves
--   The Water → Monthly dashboard reads the normalized long-format tables
--   (water_meters + water_monthly_consumption). Monthly readings, however,
--   were loaded by hand each month (update_water_<mon>.sql scripts), so the
--   dashboard lagged whatever surface the readings were actually entered
--   into — June 2026 was the latest casualty. The legacy wide "Water
--   System" surface also became a read-only VIEW in schema v2, silently
--   breaking every older script that INSERTs/UPDATEs it, and its month
--   columns were hardcoded to end at dec_26.
--
-- What this migration does
--   1. water_wide_col_to_period(col)   — 'jun_26' → '2026-06'.
--   2. water_system_view_write()       — INSTEAD OF INSERT/UPDATE trigger
--      for the "Water System" view. Any row written to the wide shape is
--      decomposed and upserted into water_meters (auto-registering brand
--      new meters) and water_monthly_consumption (only the month cells
--      that actually changed). Clearing a cell (NULL) nulls the stored
--      reading. Legacy zone/parent/type spellings are translated to the
--      clean v2 codes on the way in — the exact inverse of the view's
--      read-side translation.
--   3. rebuild_water_system_view()     — regenerates the view dynamically
--      from Jan-2024 through December of (greatest data/calendar year)+1,
--      re-attaches the trigger and re-applies grants. New years therefore
--      appear as columns without any schema edit.
--   4. Runs the rebuild once, and schedules it monthly via pg_cron
--      (1st of each month, 00:10 UTC) so the view horizon keeps extending
--      forever without manual intervention.
--   5. Adds water_meters + water_monthly_consumption to the
--      supabase_realtime publication so open dashboards refresh live when
--      monthly data lands (the app subscribes to these tables; the old
--      subscription pointed at the view, which never emits events).
--
-- Write-path behaviour (via the view)
--   • INSERT with an unknown account_number auto-registers the meter
--     (meter_id 'WS-<account>') and stores every non-NULL month provided.
--   • UPDATE propagates changed metadata (name/level/zone/parent/type)
--     and changed month cells only. Unchanged columns cost nothing.
--   • DELETE is intentionally NOT supported — removing a meter is a
--     registry operation; do it on water_meters (consumption rows cascade).
--   • RLS still applies: the trigger runs as the caller, so anon can read
--     but not write; authenticated/service writers pass the existing
--     "authed write" policies on the base tables.
--
-- Re-run safe: CREATE OR REPLACE everywhere; publication/cron additions
-- are guarded; the view rebuild is idempotent.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Wide column name → long period key ─────────────────────────────
CREATE OR REPLACE FUNCTION public.water_wide_col_to_period(col text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
    SELECT '20' || split_part(col, '_', 2) || '-' ||
           lpad(array_position(
                    ARRAY['jan','feb','mar','apr','may','jun',
                          'jul','aug','sep','oct','nov','dec'],
                    lower(split_part(col, '_', 1))
                )::text, 2, '0');
$$;

-- ── 2. INSTEAD OF trigger: wide writes → long tables ──────────────────
CREATE OR REPLACE FUNCTION public.water_system_view_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
    new_j jsonb := to_jsonb(NEW);
    old_j jsonb := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END;
    acct  text  := NULLIF(btrim(COALESCE(NEW.account_number, '')), '');
    mid   text;
    clean_zone   text;
    clean_parent text;
    clean_type   text;
    clean_level  text;
    entry  record;
    p      text;
BEGIN
    IF acct IS NULL THEN
        RAISE EXCEPTION 'Water System: account_number is required';
    END IF;

    -- Legacy → clean translations (inverse of the view's read-side CASEs).
    clean_zone := CASE NEW.zone
        WHEN 'Zone_01_(FM)'      THEN 'Zone_FM'
        WHEN 'Zone_03_(A)'       THEN 'Zone_03A'
        WHEN 'Zone_03_(B)'       THEN 'Zone_03B'
        WHEN 'Direct Connection' THEN 'Direct_Connection'
        WHEN 'Main Bulk'         THEN 'Main_Bulk'
        ELSE NEW.zone
    END;
    clean_parent := CASE NEW.parent_meter
        WHEN 'ZONE 3A (BULK ZONE 3A)'     THEN 'Zone 3A (Bulk)'
        WHEN 'ZONE 3B (BULK ZONE 3B)'     THEN 'Zone 3B (Bulk)'
        WHEN 'ZONE 5 (Bulk Zone 5)'       THEN 'Zone 5 (Bulk)'
        WHEN 'BULK ZONE 8'                THEN 'Zone 8 (Bulk)'
        WHEN 'ZONE FM ( BULK ZONE FM )'   THEN 'Zone FM (Bulk)'
        WHEN 'Village Square (Zone Bulk)' THEN 'Village Square (Bulk)'
        ELSE NEW.parent_meter
    END;
    clean_type := CASE NEW.type
        WHEN 'D_Building_Bulk'     THEN 'Building (Bulk)'
        WHEN 'D_Building_Common'   THEN 'Building (Common)'
        WHEN 'IRR_Servies'         THEN 'Irrigation (Services)'
        WHEN 'MB_Common'           THEN 'Common Area (MB)'
        WHEN 'Main BULK'           THEN 'Main Bulk'
        WHEN 'Residential (Apart)' THEN 'Residential (Apartment)'
        ELSE NEW.type
    END;
    clean_level := CASE
        WHEN NEW.level IN ('L1','L2','L3','L4','DC','N/A') THEN NEW.level
        ELSE 'N/A'
    END;

    SELECT meter_id INTO mid FROM water_meters WHERE account_number = acct;

    IF mid IS NULL THEN
        -- Brand-new meter: register it so it appears in the app immediately.
        mid := 'WS-' || acct;
        INSERT INTO water_meters
            (meter_id, account_number, meter_name, meter_name_original,
             label, zone, parent_meter, type, sort_order)
        VALUES (
            mid, acct,
            COALESCE(NULLIF(btrim(NEW.label), ''), 'Unknown Meter'),
            NEW.label,
            clean_level,
            COALESCE(NULLIF(btrim(clean_zone), ''), 'Unzoned'),
            clean_parent,
            COALESCE(NULLIF(btrim(clean_type), ''), 'Unknown'),
            COALESCE(NEW.id, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM water_meters))
        )
        ON CONFLICT (account_number) DO NOTHING;
        SELECT meter_id INTO mid FROM water_meters WHERE account_number = acct;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Propagate metadata edits to the registry (changed fields only).
        UPDATE water_meters SET
            meter_name          = CASE WHEN NEW.label IS DISTINCT FROM OLD.label
                                        AND NULLIF(btrim(NEW.label), '') IS NOT NULL
                                       THEN btrim(NEW.label) ELSE meter_name END,
            meter_name_original = CASE WHEN NEW.label IS DISTINCT FROM OLD.label
                                       THEN NEW.label ELSE meter_name_original END,
            label        = CASE WHEN NEW.level IS DISTINCT FROM OLD.level
                                THEN clean_level ELSE label END,
            zone         = CASE WHEN NEW.zone IS DISTINCT FROM OLD.zone
                                 AND NULLIF(btrim(clean_zone), '') IS NOT NULL
                                THEN clean_zone ELSE zone END,
            parent_meter = CASE WHEN NEW.parent_meter IS DISTINCT FROM OLD.parent_meter
                                THEN clean_parent ELSE parent_meter END,
            type         = CASE WHEN NEW.type IS DISTINCT FROM OLD.type
                                 AND NULLIF(btrim(clean_type), '') IS NOT NULL
                                THEN clean_type ELSE type END,
            sort_order   = CASE WHEN NEW.id IS DISTINCT FROM OLD.id AND NEW.id IS NOT NULL
                                THEN NEW.id ELSE sort_order END
        WHERE account_number = acct
          AND (NEW.label        IS DISTINCT FROM OLD.label
            OR NEW.level        IS DISTINCT FROM OLD.level
            OR NEW.zone         IS DISTINCT FROM OLD.zone
            OR NEW.parent_meter IS DISTINCT FROM OLD.parent_meter
            OR NEW.type         IS DISTINCT FROM OLD.type
            OR (NEW.id IS DISTINCT FROM OLD.id AND NEW.id IS NOT NULL));
    END IF;

    IF mid IS NULL THEN
        RAISE EXCEPTION 'Water System: could not resolve meter for account %', acct;
    END IF;

    -- Upsert every month value provided (INSERT) or changed (UPDATE).
    FOR entry IN SELECT key, value FROM jsonb_each(new_j) LOOP
        CONTINUE WHEN entry.key !~ '^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)_[0-9]{2}$';
        CONTINUE WHEN old_j IS NOT NULL
                  AND (old_j -> entry.key) IS NOT DISTINCT FROM entry.value;

        p := water_wide_col_to_period(entry.key);

        IF entry.value IS NULL OR entry.value = 'null'::jsonb THEN
            -- Cell cleared: null out the stored reading if one exists.
            UPDATE water_monthly_consumption
               SET consumption = NULL
             WHERE meter_id = mid AND period = p;
        ELSE
            INSERT INTO water_monthly_consumption (meter_id, account_number, period, consumption)
            VALUES (mid, acct, p, (entry.value #>> '{}')::numeric)
            ON CONFLICT (meter_id, period) DO UPDATE
                SET consumption = EXCLUDED.consumption;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$fn$;

-- ── 3. Dynamic, self-extending view rebuild ────────────────────────────
CREATE OR REPLACE FUNCTION public.rebuild_water_system_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    end_year   int;
    month_cols text;
BEGIN
    -- Cover one year past the latest of (calendar year, newest data year)
    -- so January writes never race the rebuild.
    SELECT GREATEST(
               EXTRACT(YEAR FROM CURRENT_DATE)::int,
               COALESCE(MAX(LEFT(period, 4))::int, 2026)
           ) + 1
      INTO end_year
      FROM water_monthly_consumption;

    SELECT string_agg(
               format('max(c.consumption) FILTER (WHERE c.period = %L) AS %I',
                      to_char(m, 'YYYY-MM'),
                      to_char(m, 'mon') || '_' || to_char(m, 'YY')),
               E',\n            ' ORDER BY m)
      INTO month_cols
      FROM generate_series(DATE '2024-01-01',
                           make_date(end_year, 12, 1),
                           INTERVAL '1 month') AS m;

    EXECUTE 'DROP VIEW IF EXISTS public."Water System"';

    -- security_invoker: readers hit the base tables under their own RLS
    -- (anon/authenticated both hold read policies), quieting the
    -- "Security Definer View" advisor without changing behaviour.
    EXECUTE format($v$
        CREATE VIEW public."Water System" WITH (security_invoker = true) AS
        SELECT
            m.sort_order AS id,
            COALESCE(m.meter_name_original, m.meter_name) AS label,
            m.account_number,
            m.label AS level,
            CASE m.zone
                WHEN 'Zone_FM'           THEN 'Zone_01_(FM)'
                WHEN 'Zone_03A'          THEN 'Zone_03_(A)'
                WHEN 'Zone_03B'          THEN 'Zone_03_(B)'
                WHEN 'Direct_Connection' THEN 'Direct Connection'
                WHEN 'Main_Bulk'         THEN 'Main Bulk'
                ELSE m.zone
            END AS zone,
            CASE m.parent_meter
                WHEN 'Zone 3A (Bulk)'        THEN 'ZONE 3A (BULK ZONE 3A)'
                WHEN 'Zone 3B (Bulk)'        THEN 'ZONE 3B (BULK ZONE 3B)'
                WHEN 'Zone 5 (Bulk)'         THEN 'ZONE 5 (Bulk Zone 5)'
                WHEN 'Zone 8 (Bulk)'         THEN 'BULK ZONE 8'
                WHEN 'Zone FM (Bulk)'        THEN 'ZONE FM ( BULK ZONE FM )'
                WHEN 'Village Square (Bulk)' THEN 'Village Square (Zone Bulk)'
                ELSE m.parent_meter
            END AS parent_meter,
            CASE m.type
                WHEN 'Building (Bulk)'         THEN 'D_Building_Bulk'
                WHEN 'Building (Common)'       THEN 'D_Building_Common'
                WHEN 'Irrigation (Services)'   THEN 'IRR_Servies'
                WHEN 'Common Area (MB)'        THEN 'MB_Common'
                WHEN 'Main Bulk'               THEN 'Main BULK'
                WHEN 'Residential (Apartment)' THEN 'Residential (Apart)'
                ELSE m.type
            END AS type,
            %s
        FROM water_meters m
        LEFT JOIN water_monthly_consumption c USING (meter_id)
        GROUP BY m.meter_id, m.sort_order, m.meter_name, m.meter_name_original,
                 m.account_number, m.label, m.zone, m.parent_meter, m.type
    $v$, month_cols);

    EXECUTE 'GRANT ALL ON public."Water System" TO postgres, anon, authenticated, service_role';

    EXECUTE $t$
        CREATE TRIGGER trg_water_system_view_write
        INSTEAD OF INSERT OR UPDATE ON public."Water System"
        FOR EACH ROW EXECUTE FUNCTION public.water_system_view_write()
    $t$;
END;
$fn$;

-- The rebuild runs as postgres (owner / pg_cron); nothing else needs it.
REVOKE EXECUTE ON FUNCTION public.rebuild_water_system_view() FROM PUBLIC, anon, authenticated;

-- ── 4. Rebuild now + keep rebuilding monthly (pg_cron) ────────────────
SELECT public.rebuild_water_system_view();

DO $$
DECLARE
    jid int;
BEGIN
    SELECT jobid INTO jid FROM cron.job WHERE jobname = 'water-system-view-rebuild';
    IF jid IS NOT NULL THEN
        PERFORM cron.unschedule(jid);
    END IF;
    PERFORM cron.schedule(
        'water-system-view-rebuild',
        '10 0 1 * *',  -- 00:10 UTC on the 1st of every month
        'SELECT public.rebuild_water_system_view()'
    );
END $$;

-- ── 5. Realtime: publish the tables the app actually reads ────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public' AND tablename = 'water_monthly_consumption'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.water_monthly_consumption;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public' AND tablename = 'water_meters'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.water_meters;
    END IF;
END $$;
