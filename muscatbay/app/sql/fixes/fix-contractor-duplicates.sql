-- Fix: Remove duplicate rows from Contractor_Tracker
-- Run this ONCE in Supabase SQL Editor to clean up existing duplicates
-- Then the seed script's ON CONFLICT clause will prevent future duplicates

-- Step 1: Show current duplicate count
SELECT "Contractor", "Service Provided", COUNT(*) as copies
FROM "Contractor_Tracker"
GROUP BY "Contractor", "Service Provided"
HAVING COUNT(*) > 1
ORDER BY copies DESC;

-- Step 2: Delete duplicates, keeping one row per (Contractor, Service Provided)
DELETE FROM "Contractor_Tracker"
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM "Contractor_Tracker"
    GROUP BY "Contractor", "Service Provided"
);

-- Step 3: Add unique constraint to prevent future duplicates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'contractor_tracker_unique_entry'
    ) THEN
        ALTER TABLE "Contractor_Tracker"
        ADD CONSTRAINT contractor_tracker_unique_entry
        UNIQUE ("Contractor", "Service Provided");
    END IF;
END $$;

-- Step 4: Verify — should show 0 duplicates and correct total count
SELECT 'Duplicates remaining:' as check, COUNT(*) as count FROM (
    SELECT "Contractor", "Service Provided"
    FROM "Contractor_Tracker"
    GROUP BY "Contractor", "Service Provided"
    HAVING COUNT(*) > 1
) dupes;

SELECT 'Total rows:' as check, COUNT(*) as count FROM "Contractor_Tracker";
