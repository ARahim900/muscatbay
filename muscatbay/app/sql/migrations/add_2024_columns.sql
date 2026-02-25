-- =====================================================
-- Recreate "Water System" as a TABLE with 2024+2025 columns
-- "Water System" is currently a VIEW, so we must drop it first
-- Run this in Supabase SQL Editor BEFORE running the seed script
-- =====================================================

-- Step 1: Drop the view (and any policies referencing it)
DROP VIEW IF EXISTS "Water System" CASCADE;

-- Step 2: Also drop if it exists as a table (safety)
DROP TABLE IF EXISTS "Water System" CASCADE;

-- Step 3: Create the table with ALL month columns (Jan-24 through Feb-26)
CREATE TABLE "Water System" (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL,
    account_number TEXT NOT NULL,
    level TEXT NOT NULL,
    zone TEXT NOT NULL,
    parent_meter TEXT,
    type TEXT,
    -- 2024 Monthly consumption
    jan_24 REAL,
    feb_24 REAL,
    mar_24 REAL,
    apr_24 REAL,
    may_24 REAL,
    jun_24 REAL,
    jul_24 REAL,
    aug_24 REAL,
    sep_24 REAL,
    oct_24 REAL,
    nov_24 REAL,
    dec_24 REAL,
    -- 2025 Monthly consumption
    jan_25 REAL,
    feb_25 REAL,
    mar_25 REAL,
    apr_25 REAL,
    may_25 REAL,
    jun_25 REAL,
    jul_25 REAL,
    aug_25 REAL,
    sep_25 REAL,
    oct_25 REAL,
    nov_25 REAL,
    dec_25 REAL,
    -- 2026
    jan_26 REAL,
    feb_26 REAL,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Enable RLS and create policies for anonymous access
ALTER TABLE "Water System" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access" ON "Water System"
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert" ON "Water System"
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update" ON "Water System"
    FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anonymous delete" ON "Water System"
    FOR DELETE TO anon USING (true);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_water_system_zone ON "Water System" (zone);
CREATE INDEX IF NOT EXISTS idx_water_system_level ON "Water System" (level);
CREATE INDEX IF NOT EXISTS idx_water_system_account ON "Water System" (account_number);

-- Done! Now run the Node.js seed script:
--   node scripts/seeds/seed-water-full.js
