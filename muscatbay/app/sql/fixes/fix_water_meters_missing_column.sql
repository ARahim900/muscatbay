-- ═══════════════════════════════════════════════════════════════════════
-- Repair: add parent_account_number if a partial run left it missing
-- Safe to run multiple times — all statements are idempotent.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Add the missing column if the table was partially created earlier
ALTER TABLE water_meters
    ADD COLUMN IF NOT EXISTS parent_account_number TEXT;

-- 2. Make sure every column the schema expects is present (defensive)
ALTER TABLE water_meters ADD COLUMN IF NOT EXISTS meter_name_original TEXT;
ALTER TABLE water_meters ADD COLUMN IF NOT EXISTS sort_order           INTEGER;
ALTER TABLE water_meters ADD COLUMN IF NOT EXISTS created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE water_meters ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Indexes that may have been skipped because of the previous error
CREATE INDEX IF NOT EXISTS idx_water_meters_account     ON water_meters (account_number);
CREATE INDEX IF NOT EXISTS idx_water_meters_label       ON water_meters (label);
CREATE INDEX IF NOT EXISTS idx_water_meters_zone        ON water_meters (zone);
CREATE INDEX IF NOT EXISTS idx_water_meters_parent_acct ON water_meters (parent_account_number);
CREATE INDEX IF NOT EXISTS idx_water_meters_sort        ON water_meters (sort_order);

COMMIT;

-- 4. Confirm the table now has every expected column
SELECT column_name, data_type
FROM   information_schema.columns
WHERE  table_schema = 'public'
  AND  table_name   = 'water_meters'
ORDER  BY ordinal_position;
-- Expected: meter_id, account_number, meter_name, meter_name_original,
--           label, zone, parent_meter, parent_account_number, type,
--           sort_order, created_at, updated_at
