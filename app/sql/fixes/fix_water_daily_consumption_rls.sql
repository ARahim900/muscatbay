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

-- Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous read access" ON water_daily_consumption;
DROP POLICY IF EXISTS "Allow anonymous insert" ON water_daily_consumption;
DROP POLICY IF EXISTS "Allow anonymous update" ON water_daily_consumption;
DROP POLICY IF EXISTS "Allow anonymous delete" ON water_daily_consumption;

-- Recreate all policies for anonymous (anon) access
CREATE POLICY "Allow anonymous read access" ON water_daily_consumption
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert" ON water_daily_consumption
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update" ON water_daily_consumption
    FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anonymous delete" ON water_daily_consumption
    FOR DELETE TO anon USING (true);

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
