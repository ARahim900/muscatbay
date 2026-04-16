-- ═══════════════════════════════════════════════════════════════════════
-- Reset Water Schema v2 — drops only the NEW tables/views introduced by
-- 202604_water_schema_v2_cle.sql, so a clean re-run can succeed.
--
-- SAFE: does NOT touch the historic "Water System" table or
--       water_daily_consumption table data. Only drops objects created
--       by the v2 migration.
--
-- Run this in a new Supabase SQL Editor query, then re-run
-- sql/migrations/202604_water_schema_v2_cle.sql from scratch.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- Drop the backward-compat view (only exists if v2 migration ran far enough)
DROP VIEW  IF EXISTS "Water System" CASCADE;

-- Drop the hierarchy view
DROP VIEW  IF EXISTS water_meters_hierarchy CASCADE;

-- Drop the long-format monthly table (drops its FK to water_meters too)
DROP TABLE IF EXISTS water_monthly_consumption CASCADE;

-- Drop the partially-created master registry
DROP TABLE IF EXISTS water_meters CASCADE;

-- Drop the trigger function (safe to recreate on next run)
DROP FUNCTION IF EXISTS water_meters_set_updated_at() CASCADE;

-- Remove the meter_id column from water_daily_consumption if it was added
-- (safe: nullable column, no data depends on it)
ALTER TABLE IF EXISTS water_daily_consumption DROP COLUMN IF EXISTS meter_id;

COMMIT;

-- Confirm cleanup
SELECT 'water_meters' AS obj,
       EXISTS(SELECT 1 FROM information_schema.tables
              WHERE table_schema = 'public' AND table_name = 'water_meters') AS still_exists
UNION ALL
SELECT 'water_monthly_consumption',
       EXISTS(SELECT 1 FROM information_schema.tables
              WHERE table_schema = 'public' AND table_name = 'water_monthly_consumption')
UNION ALL
SELECT 'water_meters_hierarchy (view)',
       EXISTS(SELECT 1 FROM information_schema.views
              WHERE table_schema = 'public' AND table_name = 'water_meters_hierarchy')
UNION ALL
SELECT 'Water System (current type)',
       EXISTS(SELECT 1 FROM information_schema.tables
              WHERE table_schema = 'public' AND table_name = 'Water System');

-- Interpretation of the result set:
--   • The first three rows should all show FALSE (cleanly removed).
--   • The fourth row ("Water System") should show TRUE — that means the
--     original wide table is still intact. The next schema-v2 run will
--     replace it with the backward-compat view in a single transaction.
