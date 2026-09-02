-- Durable operational-alert lifecycle. This migration is schema-only and
-- intentionally does not import or rewrite any existing operational data.

begin;

CREATE TABLE IF NOT EXISTS public.operational_alert_incidents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint text NOT NULL,
    module text NOT NULL CHECK (module IN ('water', 'contractors', 'stp')),
    category text NOT NULL CHECK (category IN ('data_quality', 'process_performance', 'contract_compliance', 'water_balance')),
    level text NOT NULL CHECK (level IN ('error', 'warning', 'info')),
    title text NOT NULL,
    message text NOT NULL,
    href text NOT NULL,
    detected_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    acknowledged_at timestamptz,
    acknowledged_by uuid REFERENCES auth.users(id),
    resolved_at timestamptz,
    resolution_reason text,
    CHECK ((acknowledged_at IS NULL) = (acknowledged_by IS NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS operational_alert_one_open_episode
    ON public.operational_alert_incidents (fingerprint)
    WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS operational_alert_active_order
    ON public.operational_alert_incidents (resolved_at, level, detected_at DESC);

ALTER TABLE public.operational_alert_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operational_alert_incidents_read ON public.operational_alert_incidents;
CREATE POLICY operational_alert_incidents_read
    ON public.operational_alert_incidents
    FOR SELECT
    TO authenticated
    USING ((SELECT public.mb_can_read_module('alerts')));

-- REVOKE ALL, not just the write verbs. Supabase's default privileges grant
-- every new public table to anon and authenticated, so revoking writes alone
-- left anon holding SELECT. RLS still returned zero rows to anon (no policy
-- names that role), but relying on that is one permissive policy away from a
-- real leak, and it leaves the table's shape visible to unauthenticated
-- PostgREST introspection. This matches how migration
-- 20260901_invitation_only_security_and_rls treats every other server_owned
-- relation; that migration's fail-closed sweep cannot cover this table because
-- it runs before this one creates it.
REVOKE ALL ON public.operational_alert_incidents FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.operational_alert_incidents TO authenticated;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (
           SELECT 1 FROM pg_publication_tables
           WHERE pubname = 'supabase_realtime'
             AND schemaname = 'public'
             AND tablename = 'operational_alert_incidents'
       ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_alert_incidents;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.acknowledge_operational_alert_incident(p_incident_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF (SELECT auth.uid()) IS NULL
       OR NOT public.mb_has_any_role(ARRAY['admin', 'manager', 'operator']::text[]) THEN
        RAISE EXCEPTION 'Operator role required' USING ERRCODE = '42501';
    END IF;

    UPDATE public.operational_alert_incidents
    SET acknowledged_at = COALESCE(acknowledged_at, now()),
        acknowledged_by = COALESCE(acknowledged_by, (SELECT auth.uid()))
    WHERE id = p_incident_id
      AND resolved_at IS NULL;

    RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.acknowledge_operational_alert_incident(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acknowledge_operational_alert_incident(uuid) TO authenticated;

-- Called only by a trusted server-side evaluator after it has successfully
-- read the named modules.
--
-- TWO SEPARATE GRANTS, and conflating them is what this signature exists to
-- prevent:
--
--   p_evaluated_modules  — modules the evaluator READ. Their alerts are
--       upserted. A source outage keeps a module out of this list entirely, so
--       it cannot make a critical incident disappear.
--   p_resolvable_modules — the subset whose evidence was COMPLETE, so the
--       absence of a condition is a real observation rather than a gap in the
--       data. Only these auto-resolve.
--
-- A module that returned sparse rows therefore still records its data-quality
-- alert while being denied the authority to close anything. Passing NULL for
-- p_resolvable_modules resolves nothing, which is the safe default.
DROP FUNCTION IF EXISTS public.reconcile_operational_alert_incidents(jsonb, text[]);

CREATE OR REPLACE FUNCTION public.reconcile_operational_alert_incidents(
    p_alerts jsonb,
    p_evaluated_modules text[],
    p_resolvable_modules text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    alert jsonb;
    active_fingerprints text[] := ARRAY[]::text[];
    -- Normalise up front: a NULL array makes every `= ANY (...)` test return
    -- NULL, which an IF reads as false — so an unchecked NULL would skip the
    -- module guard below entirely instead of failing loudly.
    evaluated_modules text[] := COALESCE(p_evaluated_modules, ARRAY[]::text[]);
    resolvable_modules text[] := COALESCE(p_resolvable_modules, ARRAY[]::text[]);
BEGIN
    IF p_alerts IS NULL OR jsonb_typeof(p_alerts) <> 'array' THEN
        RAISE EXCEPTION 'p_alerts must be a JSON array';
    END IF;

    -- Resolution authority is a subset of what was read; anything else is a
    -- caller bug that would silently close incidents nobody evaluated.
    IF EXISTS (
        SELECT 1 FROM unnest(resolvable_modules) AS m
        WHERE NOT (m = ANY (evaluated_modules))
    ) THEN
        RAISE EXCEPTION 'Resolvable modules must be a subset of evaluated modules';
    END IF;

    FOR alert IN SELECT value FROM jsonb_array_elements(p_alerts)
    LOOP
        IF NOT ((alert->>'module') = ANY (evaluated_modules)) THEN
            RAISE EXCEPTION 'Alert module was not evaluated: %', alert->>'module';
        END IF;

        active_fingerprints := array_append(active_fingerprints, alert->>'id');

        -- Level, title and message are COLUMNS, not identity: an incident that
        -- escalates from warning to error is re-levelled here and keeps its
        -- acknowledgement, rather than being closed and re-raised.
        UPDATE public.operational_alert_incidents
        SET last_seen_at = now(),
            level = alert->>'level',
            category = alert->>'category',
            title = alert->>'title',
            message = alert->>'message',
            href = alert->>'href'
        WHERE fingerprint = alert->>'id'
          AND resolved_at IS NULL;

        IF NOT FOUND THEN
            INSERT INTO public.operational_alert_incidents (
                fingerprint, module, category, level, title, message, href
            ) VALUES (
                alert->>'id', alert->>'module', alert->>'category', alert->>'level',
                alert->>'title', alert->>'message', alert->>'href'
            );
        END IF;
    END LOOP;

    IF array_length(resolvable_modules, 1) IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.operational_alert_incidents
    SET resolved_at = now(),
        resolution_reason = 'Condition absent after a complete source evaluation'
    WHERE resolved_at IS NULL
      AND module = ANY (resolvable_modules)
      AND NOT (fingerprint = ANY (active_fingerprints));
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_operational_alert_incidents(jsonb, text[], text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_operational_alert_incidents(jsonb, text[], text[]) TO service_role;

commit;
