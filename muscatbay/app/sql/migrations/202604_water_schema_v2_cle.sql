-- ═══════════════════════════════════════════════════════════════════════
-- Water System — Schema v2 (CLE / Clean)
--
-- Purpose
--   Replaces the ad-hoc "Water System" wide table with a normalized schema
--   aligned to the cleaned master registry (Water_Meter_Database_CLE.xlsx).
--
--   Changes vs. v1
--   ──────────────────────────────────────────────────────────────────────
--   • Introduces stable Meter IDs (MB-L1-001, MB-L2-001, …, MB-L4-183).
--   • Normalizes naming (zones, types, parents) per the CLE audit log:
--       - Zone_01_(FM)           → Zone_FM
--       - Zone_03_(A)/(B)        → Zone_03A / Zone_03B
--       - Direct Connection      → Direct_Connection
--       - D_Building_Bulk        → Building (Bulk)
--       - D_Building_Common      → Building (Common)
--       - IRR_Servies  (typo)    → Irrigation (Services)
--       - MB_Common              → Common Area (MB)
--       - Main BULK              → Main Bulk
--       - Residential (Apart)    → Residential (Apartment)
--   • Preserves the original messy name for audit in
--     water_meters.meter_name_original.
--   • Moves monthly consumption from 12 wide columns to a long-format
--     table spanning 2024, 2025, 2026 (and future years with no DDL
--     changes).
--   • Backward-compat view "Water System" exposes the 2025 wide shape so
--     existing app code continues to function while the migration rolls
--     out gradually.
--
-- Apply order
--   1. This file                                  (creates tables + views)
--   2. sql/data/water_meters_seed.sql             (350 meter rows)
--   3. sql/data/water_monthly_consumption_seed.sql (9,448 monthly values)
--
-- Re-run safe
--   All DDL uses IF NOT EXISTS / CREATE OR REPLACE. Seeds use ON CONFLICT.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Master meter registry ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS water_meters (
    meter_id              TEXT PRIMARY KEY,               -- e.g. 'MB-L2-001'
    account_number        TEXT NOT NULL UNIQUE,           -- e.g. '4300343'
    meter_name            TEXT NOT NULL,                  -- cleaned name
    meter_name_original   TEXT,                           -- audit reference
    label                 TEXT NOT NULL
        CHECK (label IN ('L1','L2','L3','L4','DC','N/A')),
    zone                  TEXT NOT NULL,
    parent_meter          TEXT,
    parent_account_number TEXT,                           -- soft FK to water_meters.account_number
    type                  TEXT NOT NULL,
    sort_order            INTEGER,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_meters_account     ON water_meters (account_number);
CREATE INDEX IF NOT EXISTS idx_water_meters_label       ON water_meters (label);
CREATE INDEX IF NOT EXISTS idx_water_meters_zone        ON water_meters (zone);
CREATE INDEX IF NOT EXISTS idx_water_meters_parent_acct ON water_meters (parent_account_number);
CREATE INDEX IF NOT EXISTS idx_water_meters_sort        ON water_meters (sort_order);

-- Auto-bump updated_at
CREATE OR REPLACE FUNCTION water_meters_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_water_meters_updated_at ON water_meters;
CREATE TRIGGER trg_water_meters_updated_at
    BEFORE UPDATE ON water_meters
    FOR EACH ROW EXECUTE FUNCTION water_meters_set_updated_at();

-- ── 2. Long-format monthly consumption ────────────────────────────────
CREATE TABLE IF NOT EXISTS water_monthly_consumption (
    meter_id       TEXT NOT NULL REFERENCES water_meters(meter_id) ON UPDATE CASCADE ON DELETE CASCADE,
    account_number TEXT NOT NULL,                         -- denormalized for fast join-less queries
    period         TEXT NOT NULL                          -- 'YYYY-MM' (e.g. '2025-03')
        CHECK (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    consumption    NUMERIC(12,2),                         -- m³, nullable if not yet reported
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (meter_id, period)
);

CREATE INDEX IF NOT EXISTS idx_wmc_period  ON water_monthly_consumption (period);
CREATE INDEX IF NOT EXISTS idx_wmc_account ON water_monthly_consumption (account_number, period);

DROP TRIGGER IF EXISTS trg_wmc_updated_at ON water_monthly_consumption;
CREATE TRIGGER trg_wmc_updated_at
    BEFORE UPDATE ON water_monthly_consumption
    FOR EACH ROW EXECUTE FUNCTION water_meters_set_updated_at();

-- Keep the denormalized account_number in sync when water_meters
-- renumbers an account. Without this, water_monthly_consumption would
-- drift silently: the meter_id FK still resolves (ON UPDATE CASCADE)
-- but the cached account_number column would point at the old number,
-- breaking the idx_wmc_account lookup path used by downstream queries.
CREATE OR REPLACE FUNCTION water_meters_sync_account_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.account_number IS DISTINCT FROM OLD.account_number THEN
        UPDATE water_monthly_consumption
           SET account_number = NEW.account_number,
               updated_at     = NOW()
         WHERE meter_id = NEW.meter_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_water_meters_sync_account_number ON water_meters;
CREATE TRIGGER trg_water_meters_sync_account_number
    AFTER UPDATE OF account_number ON water_meters
    FOR EACH ROW EXECUTE FUNCTION water_meters_sync_account_number();

-- ── 3. Backfill meter_id on the existing daily consumption table ──────
-- water_daily_consumption was denormalized (carries name, zone, type). We
-- add meter_id as a FK and then propagate the clean metadata from the
-- master registry. The column is nullable during backfill; tighten later.
ALTER TABLE IF EXISTS water_daily_consumption
    ADD COLUMN IF NOT EXISTS meter_id TEXT REFERENCES water_meters(meter_id) ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_wdc_meter_id ON water_daily_consumption (meter_id);

-- Re-runnable backfill of meter_id from water_meters
UPDATE water_daily_consumption d
SET    meter_id = m.meter_id
FROM   water_meters m
WHERE  d.account_number = m.account_number
  AND  (d.meter_id IS NULL OR d.meter_id <> m.meter_id);

-- Re-runnable backfill of cleaned metadata columns (when the seeds are loaded)
UPDATE water_daily_consumption d
SET    meter_name   = m.meter_name,
       label        = m.label,
       zone         = m.zone,
       parent_meter = m.parent_meter,
       type         = m.type
FROM   water_meters m
WHERE  d.meter_id = m.meter_id
  AND  (d.meter_name   IS DISTINCT FROM m.meter_name
     OR d.label        IS DISTINCT FROM m.label
     OR d.zone         IS DISTINCT FROM m.zone
     OR d.parent_meter IS DISTINCT FROM m.parent_meter
     OR d.type         IS DISTINCT FROM m.type);

-- ── 4. Backward-compat view: "Water System" (wide, 2025) ──────────────
-- Existing app code (lib/water-data.ts, Monthly view) reads the wide
-- "Water System" table with jan_25..dec_25 columns AND expects the OLD
-- zone/type/parent naming (Zone_01_(FM), IRR_Servies, D_Building_Bulk,
-- Main BULK, etc.). This view:
--   • reshapes water_monthly_consumption into the old wide layout, and
--   • translates clean names back to the legacy naming for zone, type,
--     parent_meter, and label (meter_name_original) so no app code has
--     to change on day 1.
-- Once the app is refactored to read water_meters directly, this view
-- can be dropped.
DROP VIEW  IF EXISTS "Water System";
DROP TABLE IF EXISTS "Water System" CASCADE;

CREATE OR REPLACE VIEW "Water System" AS
SELECT
    m.sort_order           AS id,
    -- Preserve the original (pre-cleanup) meter name so code that greps by
    -- label matches historic strings like 'ZONE 3A (BULK ZONE 3A)'.
    COALESCE(m.meter_name_original, m.meter_name) AS label,
    m.account_number,
    m.label                AS level,
    -- Translate clean zone codes back to legacy codes
    CASE m.zone
        WHEN 'Zone_FM'            THEN 'Zone_01_(FM)'
        WHEN 'Zone_03A'           THEN 'Zone_03_(A)'
        WHEN 'Zone_03B'           THEN 'Zone_03_(B)'
        WHEN 'Direct_Connection'  THEN 'Direct Connection'
        WHEN 'Main_Bulk'          THEN 'Main Bulk'
        ELSE m.zone
    END                    AS zone,
    -- Translate clean parent names back to legacy names
    CASE m.parent_meter
        WHEN 'Zone 3A (Bulk)'        THEN 'ZONE 3A (BULK ZONE 3A)'
        WHEN 'Zone 3B (Bulk)'        THEN 'ZONE 3B (BULK ZONE 3B)'
        WHEN 'Zone 5 (Bulk)'         THEN 'ZONE 5 (Bulk Zone 5)'
        WHEN 'Zone 8 (Bulk)'         THEN 'BULK ZONE 8'
        WHEN 'Zone FM (Bulk)'        THEN 'ZONE FM ( BULK ZONE FM )'
        WHEN 'Village Square (Bulk)' THEN 'Village Square (Zone Bulk)'
        ELSE m.parent_meter
    END                    AS parent_meter,
    -- Translate clean types back to legacy types
    CASE m.type
        WHEN 'Building (Bulk)'         THEN 'D_Building_Bulk'
        WHEN 'Building (Common)'       THEN 'D_Building_Common'
        WHEN 'Irrigation (Services)'   THEN 'IRR_Servies'
        WHEN 'Common Area (MB)'        THEN 'MB_Common'
        WHEN 'Main Bulk'               THEN 'Main BULK'
        WHEN 'Residential (Apartment)' THEN 'Residential (Apart)'
        ELSE m.type
    END                    AS type,
    MAX(c.consumption) FILTER (WHERE c.period = '2025-01') AS jan_25,
    MAX(c.consumption) FILTER (WHERE c.period = '2025-02') AS feb_25,
    MAX(c.consumption) FILTER (WHERE c.period = '2025-03') AS mar_25,
    MAX(c.consumption) FILTER (WHERE c.period = '2025-04') AS apr_25,
    MAX(c.consumption) FILTER (WHERE c.period = '2025-05') AS may_25,
    MAX(c.consumption) FILTER (WHERE c.period = '2025-06') AS jun_25,
    MAX(c.consumption) FILTER (WHERE c.period = '2025-07') AS jul_25,
    MAX(c.consumption) FILTER (WHERE c.period = '2025-08') AS aug_25,
    MAX(c.consumption) FILTER (WHERE c.period = '2025-09') AS sep_25,
    MAX(c.consumption) FILTER (WHERE c.period = '2025-10') AS oct_25,
    MAX(c.consumption) FILTER (WHERE c.period = '2025-11') AS nov_25,
    MAX(c.consumption) FILTER (WHERE c.period = '2025-12') AS dec_25,
    MAX(c.consumption) FILTER (WHERE c.period = '2024-01') AS jan_24,
    MAX(c.consumption) FILTER (WHERE c.period = '2024-02') AS feb_24,
    MAX(c.consumption) FILTER (WHERE c.period = '2024-03') AS mar_24,
    MAX(c.consumption) FILTER (WHERE c.period = '2024-04') AS apr_24,
    MAX(c.consumption) FILTER (WHERE c.period = '2024-05') AS may_24,
    MAX(c.consumption) FILTER (WHERE c.period = '2024-06') AS jun_24,
    MAX(c.consumption) FILTER (WHERE c.period = '2024-07') AS jul_24,
    MAX(c.consumption) FILTER (WHERE c.period = '2024-08') AS aug_24,
    MAX(c.consumption) FILTER (WHERE c.period = '2024-09') AS sep_24,
    MAX(c.consumption) FILTER (WHERE c.period = '2024-10') AS oct_24,
    MAX(c.consumption) FILTER (WHERE c.period = '2024-11') AS nov_24,
    MAX(c.consumption) FILTER (WHERE c.period = '2024-12') AS dec_24,
    MAX(c.consumption) FILTER (WHERE c.period = '2026-01') AS jan_26,
    MAX(c.consumption) FILTER (WHERE c.period = '2026-02') AS feb_26,
    MAX(c.consumption) FILTER (WHERE c.period = '2026-03') AS mar_26,
    MAX(c.consumption) FILTER (WHERE c.period = '2026-04') AS apr_26,
    MAX(c.consumption) FILTER (WHERE c.period = '2026-05') AS may_26,
    MAX(c.consumption) FILTER (WHERE c.period = '2026-06') AS jun_26,
    MAX(c.consumption) FILTER (WHERE c.period = '2026-07') AS jul_26,
    MAX(c.consumption) FILTER (WHERE c.period = '2026-08') AS aug_26,
    MAX(c.consumption) FILTER (WHERE c.period = '2026-09') AS sep_26,
    MAX(c.consumption) FILTER (WHERE c.period = '2026-10') AS oct_26,
    MAX(c.consumption) FILTER (WHERE c.period = '2026-11') AS nov_26,
    MAX(c.consumption) FILTER (WHERE c.period = '2026-12') AS dec_26
FROM       water_meters m
LEFT JOIN  water_monthly_consumption c USING (meter_id)
-- m.meter_name_original is projected via COALESCE above, so include it in
-- GROUP BY explicitly. Postgres would also accept it implicitly via the
-- functional-dependency rule (m.meter_id is the PK), but the explicit form
-- is portable to strict SQL linters and survives future GROUP BY edits.
GROUP BY   m.meter_id, m.sort_order, m.meter_name, m.meter_name_original,
           m.account_number, m.label, m.zone, m.parent_meter, m.type
ORDER BY   m.sort_order;

-- ── 5. Hierarchy helper view ──────────────────────────────────────────
-- Quick lookup of each meter's L1 → L2/DC → L3 → L4 ancestry. Useful for
-- the Daily hierarchy panel and any loss calculations.
CREATE OR REPLACE VIEW water_meters_hierarchy AS
WITH RECURSIVE tree AS (
    -- Roots (L1)
    SELECT m.meter_id,
           m.account_number,
           m.meter_name,
           m.label,
           m.zone,
           m.parent_account_number,
           ARRAY[m.meter_id] AS path,
           1                  AS depth
    FROM   water_meters m
    WHERE  m.label = 'L1'
    UNION ALL
    SELECT c.meter_id,
           c.account_number,
           c.meter_name,
           c.label,
           c.zone,
           c.parent_account_number,
           tree.path || c.meter_id,
           tree.depth + 1
    FROM   water_meters c
    JOIN   tree ON tree.account_number = c.parent_account_number
    WHERE  tree.depth < 5
)
SELECT * FROM tree;

-- ── 6. Row Level Security ─────────────────────────────────────────────
-- Reads: open to anon + authenticated so the dashboard works for any
--        signed-in (or even signed-out) viewer.
-- Writes: restricted to users whose profiles.role = 'admin'. Regular
--        staff accounts cannot modify meter registry or consumption
--        rows even when authenticated — only admins can. A helper SQL
--        function is used so the subquery is wrapped once and stays
--        readable in EXPLAIN plans.
ALTER TABLE water_meters               ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_monthly_consumption  ENABLE ROW LEVEL SECURITY;

-- Helper: is the current caller an admin per the profiles table?
--   SECURITY DEFINER lets the policy bypass RLS on profiles (the policy
--   runs as the function owner, not the caller), avoiding a recursive
--   RLS loop. STABLE marks it cache-friendly within a single statement.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
         WHERE id = auth.uid()
           AND role = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

DROP POLICY IF EXISTS "water_meters anon read"          ON water_meters;
DROP POLICY IF EXISTS "water_meters authed write"       ON water_meters;
DROP POLICY IF EXISTS "water_meters admin write"        ON water_meters;
DROP POLICY IF EXISTS "wmc anon read"                   ON water_monthly_consumption;
DROP POLICY IF EXISTS "wmc authed write"                ON water_monthly_consumption;
DROP POLICY IF EXISTS "wmc admin write"                 ON water_monthly_consumption;

CREATE POLICY "water_meters anon read"
    ON water_meters FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "water_meters admin write"
    ON water_meters FOR ALL TO authenticated
    USING      (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "wmc anon read"
    ON water_monthly_consumption FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "wmc admin write"
    ON water_monthly_consumption FOR ALL TO authenticated
    USING      (public.is_admin())
    WITH CHECK (public.is_admin());

-- ── 7. Grants (Supabase default roles) ────────────────────────────────
GRANT SELECT ON water_meters, water_monthly_consumption, "Water System", water_meters_hierarchy TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON water_meters, water_monthly_consumption TO authenticated;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- POST-MIGRATION SANITY CHECKS
-- ═══════════════════════════════════════════════════════════════════════
-- After running the seed files, verify with:
--
--   SELECT label, COUNT(*) FROM water_meters GROUP BY label ORDER BY label;
--     L1=1, L2=6, DC=10, L3=146, L4=183, N/A=4
--
--   SELECT substr(period, 1, 4) AS year, COUNT(*)
--   FROM water_monthly_consumption GROUP BY 1 ORDER BY 1;
--     2024=4200, 2025=4200, 2026=1048  (subject to data availability)
--
--   SELECT * FROM "Water System" WHERE account_number = 'C43659';
--     — returns the L1 main bulk row with all month columns populated.
--
--   SELECT depth, label, COUNT(*) FROM water_meters_hierarchy
--   GROUP BY depth, label ORDER BY depth, label;
--     — verifies L1→L2/DC→L3→L4 ancestry is intact.
-- ═══════════════════════════════════════════════════════════════════════
