-- =====================================================
-- FIX: Row-Level Security Policies for water_daily_consumption
--
-- Run this script in your Supabase SQL Editor:
--   https://supabase.com/dashboard → SQL Editor → New Query
--
-- This fixes the "new row violates row-level security policy"
-- error when uploading CSV data.
-- =====================================================

-- Ensure RLS is enabled
ALTER TABLE water_daily_consumption ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start clean
DROP POLICY IF EXISTS "Allow anonymous read access" ON water_daily_consumption;
DROP POLICY IF EXISTS "Allow anonymous insert" ON water_daily_consumption;
DROP POLICY IF EXISTS "Allow anonymous update" ON water_daily_consumption;
DROP POLICY IF EXISTS "Allow anonymous delete" ON water_daily_consumption;
DROP POLICY IF EXISTS "Allow public read access to water_daily_consumption" ON water_daily_consumption;
DROP POLICY IF EXISTS "Allow authenticated read" ON water_daily_consumption;
DROP POLICY IF EXISTS "Allow authenticated insert" ON water_daily_consumption;
DROP POLICY IF EXISTS "Allow authenticated update" ON water_daily_consumption;
DROP POLICY IF EXISTS "Allow authenticated delete" ON water_daily_consumption;

-- Create policies for BOTH anon and authenticated roles
-- (anon = not logged in, authenticated = logged in user)

-- SELECT
CREATE POLICY "Allow anon read" ON water_daily_consumption
    FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated read" ON water_daily_consumption
    FOR SELECT TO authenticated USING (true);

-- INSERT
CREATE POLICY "Allow anon insert" ON water_daily_consumption
    FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON water_daily_consumption
    FOR INSERT TO authenticated WITH CHECK (true);

-- UPDATE
CREATE POLICY "Allow anon update" ON water_daily_consumption
    FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow authenticated update" ON water_daily_consumption
    FOR UPDATE TO authenticated USING (true);

-- DELETE
CREATE POLICY "Allow anon delete" ON water_daily_consumption
    FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated delete" ON water_daily_consumption
    FOR DELETE TO authenticated USING (true);

-- Also ensure the unique constraint exists (needed for upsert)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'water_daily_consumption_account_number_month_year_key'
    ) THEN
        ALTER TABLE water_daily_consumption
            ADD CONSTRAINT water_daily_consumption_account_number_month_year_key
            UNIQUE (account_number, month, year);
    END IF;
END $$;

-- Verify: show current policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'water_daily_consumption';
