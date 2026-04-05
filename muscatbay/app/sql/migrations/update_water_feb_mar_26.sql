-- =====================================================
-- Water System: Add feb_26 & mar_26 columns, populate missing data
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add feb_26 column if it doesn't exist
ALTER TABLE "Water System" ADD COLUMN IF NOT EXISTS feb_26 INTEGER;

-- Add mar_26 column if it doesn't exist
ALTER TABLE "Water System" ADD COLUMN IF NOT EXISTS mar_26 INTEGER;

-- =====================================================
-- Main Bulk (NAMA) — Account: C43659
-- User note: account referenced as C65439 in request
-- =====================================================
UPDATE "Water System"
SET
    feb_26 = 37326,
    mar_26 = 47219
WHERE account_number = 'C43659';

-- =====================================================
-- Zone 08 Bulk Meter — Account: 4300342
-- =====================================================
UPDATE "Water System"
SET
    jan_26 = 2336,
    feb_26 = 2425,
    mar_26 = 2416
WHERE account_number = '4300342';

-- =====================================================
-- Verify updates
-- =====================================================
SELECT
    label,
    account_number,
    jan_26,
    feb_26,
    mar_26
FROM "Water System"
WHERE account_number IN ('C43659', '4300342')
ORDER BY account_number;
