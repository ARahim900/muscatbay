-- =====================================================
-- Fix: Add Missing Unique Constraint for CSV Upload
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Check for existing duplicates (run this first to see if there are any)
SELECT account_number, month, year, COUNT(*) as duplicate_count
FROM water_daily_consumption 
GROUP BY account_number, month, year 
HAVING COUNT(*) > 1;

-- Step 2: If Step 1 returns rows, run this to remove duplicates (keeping the latest entry)
DELETE FROM water_daily_consumption a
USING water_daily_consumption b
WHERE a.id < b.id 
  AND a.account_number = b.account_number 
  AND a.month = b.month 
  AND a.year = b.year;

-- Step 3: Add the unique constraint (required for the upsert operation in CSV import)
ALTER TABLE water_daily_consumption 
ADD CONSTRAINT water_daily_consumption_account_month_year_key 
UNIQUE (account_number, month, year);

-- Verify the constraint was added
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'water_daily_consumption'::regclass;
