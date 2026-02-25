-- =============================================================================
-- WATER SYSTEM DATA UPDATE SCRIPT
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================================

-- First, let's see what we have currently
SELECT level, COUNT(*) as count
FROM "Water System"
GROUP BY level
ORDER BY level;

-- =============================================================================
-- OPTION 1: UPDATE EXISTING RECORDS (if you want to update specific meters)
-- =============================================================================

-- Example: Update a single meter's consumption values
-- UPDATE "Water System"
-- SET
--     jan_25 = 32580, feb_25 = 44043, mar_25 = 34915, apr_25 = 46039,
--     may_25 = 58425, jun_25 = 41840, jul_25 = 41475, aug_25 = 41743,
--     sep_25 = 42088, oct_25 = 46049, nov_25 = 47347, dec_25 = 45922,
--     jan_26 = 41320, feb_26 = NULL,
--     updated_at = NOW()
-- WHERE account_number = 'C43659';

-- =============================================================================
-- OPTION 2: BULK UPDATE/INSERT WITH UPSERT
-- =============================================================================

-- The INSERT ON CONFLICT statement will:
-- - Insert new records if account_number doesn't exist
-- - Update existing records if account_number already exists

-- Template for bulk upsert (uncomment and modify with your data):
/*
INSERT INTO "Water System" (
    account_number, label, level, zone, parent_meter, type,
    jan_25, feb_25, mar_25, apr_25, may_25, jun_25,
    jul_25, aug_25, sep_25, oct_25, nov_25, dec_25,
    jan_26, feb_26
) VALUES
    -- L1 - Main NAMA
    ('C43659', 'Main Bulk NAMA', 'L1', 'Main', '', 'Bulk',
     32580, 44043, 34915, 46039, 58425, 41840,
     41475, 41743, 42088, 46049, 47347, 45922,
     41320, NULL),

    -- L2 - Zone Bulks
    ('4300324', 'Zone 8 Bulk', 'L2', 'Zone 8', 'Main Bulk NAMA', 'Zone_Bulk',
     5200, 7800, 6100, 8200, 9500, 7200,
     7000, 7300, 7500, 8500, 9000, 8200,
     10017, NULL),

    -- Add more records here...

ON CONFLICT (account_number)
DO UPDATE SET
    label = EXCLUDED.label,
    level = EXCLUDED.level,
    zone = EXCLUDED.zone,
    parent_meter = EXCLUDED.parent_meter,
    type = EXCLUDED.type,
    jan_25 = EXCLUDED.jan_25,
    feb_25 = EXCLUDED.feb_25,
    mar_25 = EXCLUDED.mar_25,
    apr_25 = EXCLUDED.apr_25,
    may_25 = EXCLUDED.may_25,
    jun_25 = EXCLUDED.jun_25,
    jul_25 = EXCLUDED.jul_25,
    aug_25 = EXCLUDED.aug_25,
    sep_25 = EXCLUDED.sep_25,
    oct_25 = EXCLUDED.oct_25,
    nov_25 = EXCLUDED.nov_25,
    dec_25 = EXCLUDED.dec_25,
    jan_26 = EXCLUDED.jan_26,
    feb_26 = EXCLUDED.feb_26,
    updated_at = NOW();
*/

-- =============================================================================
-- FIX NEGATIVE VALUES (sanitize corrupted data)
-- =============================================================================

-- This query will convert all negative consumption values to 0
-- Run this if you have corrupted negative values in your data

UPDATE "Water System"
SET
    jan_25 = CASE WHEN jan_25 < 0 THEN 0 ELSE jan_25 END,
    feb_25 = CASE WHEN feb_25 < 0 THEN 0 ELSE feb_25 END,
    mar_25 = CASE WHEN mar_25 < 0 THEN 0 ELSE mar_25 END,
    apr_25 = CASE WHEN apr_25 < 0 THEN 0 ELSE apr_25 END,
    may_25 = CASE WHEN may_25 < 0 THEN 0 ELSE may_25 END,
    jun_25 = CASE WHEN jun_25 < 0 THEN 0 ELSE jun_25 END,
    jul_25 = CASE WHEN jul_25 < 0 THEN 0 ELSE jul_25 END,
    aug_25 = CASE WHEN aug_25 < 0 THEN 0 ELSE aug_25 END,
    sep_25 = CASE WHEN sep_25 < 0 THEN 0 ELSE sep_25 END,
    oct_25 = CASE WHEN oct_25 < 0 THEN 0 ELSE oct_25 END,
    nov_25 = CASE WHEN nov_25 < 0 THEN 0 ELSE nov_25 END,
    dec_25 = CASE WHEN dec_25 < 0 THEN 0 ELSE dec_25 END,
    jan_26 = CASE WHEN jan_26 < 0 THEN 0 ELSE jan_26 END,
    feb_26 = CASE WHEN feb_26 < 0 THEN 0 ELSE feb_26 END,
    updated_at = NOW()
WHERE
    jan_25 < 0 OR feb_25 < 0 OR mar_25 < 0 OR apr_25 < 0 OR
    may_25 < 0 OR jun_25 < 0 OR jul_25 < 0 OR aug_25 < 0 OR
    sep_25 < 0 OR oct_25 < 0 OR nov_25 < 0 OR dec_25 < 0 OR
    jan_26 < 0 OR feb_26 < 0;

-- =============================================================================
-- FIND METERS WITH NEGATIVE VALUES (diagnostic query)
-- =============================================================================

SELECT
    account_number,
    label,
    level,
    CASE WHEN jan_25 < 0 THEN 'Jan-25: ' || jan_25 ELSE NULL END as neg_jan_25,
    CASE WHEN feb_25 < 0 THEN 'Feb-25: ' || feb_25 ELSE NULL END as neg_feb_25,
    CASE WHEN mar_25 < 0 THEN 'Mar-25: ' || mar_25 ELSE NULL END as neg_mar_25,
    CASE WHEN apr_25 < 0 THEN 'Apr-25: ' || apr_25 ELSE NULL END as neg_apr_25,
    CASE WHEN may_25 < 0 THEN 'May-25: ' || may_25 ELSE NULL END as neg_may_25,
    CASE WHEN jun_25 < 0 THEN 'Jun-25: ' || jun_25 ELSE NULL END as neg_jun_25,
    CASE WHEN jul_25 < 0 THEN 'Jul-25: ' || jul_25 ELSE NULL END as neg_jul_25,
    CASE WHEN aug_25 < 0 THEN 'Aug-25: ' || aug_25 ELSE NULL END as neg_aug_25,
    CASE WHEN sep_25 < 0 THEN 'Sep-25: ' || sep_25 ELSE NULL END as neg_sep_25,
    CASE WHEN oct_25 < 0 THEN 'Oct-25: ' || oct_25 ELSE NULL END as neg_oct_25,
    CASE WHEN nov_25 < 0 THEN 'Nov-25: ' || nov_25 ELSE NULL END as neg_nov_25,
    CASE WHEN dec_25 < 0 THEN 'Dec-25: ' || dec_25 ELSE NULL END as neg_dec_25,
    CASE WHEN jan_26 < 0 THEN 'Jan-26: ' || jan_26 ELSE NULL END as neg_jan_26,
    CASE WHEN feb_26 < 0 THEN 'Feb-26: ' || feb_26 ELSE NULL END as neg_feb_26
FROM "Water System"
WHERE
    jan_25 < 0 OR feb_25 < 0 OR mar_25 < 0 OR apr_25 < 0 OR
    may_25 < 0 OR jun_25 < 0 OR jul_25 < 0 OR aug_25 < 0 OR
    sep_25 < 0 OR oct_25 < 0 OR nov_25 < 0 OR dec_25 < 0 OR
    jan_26 < 0 OR feb_26 < 0
ORDER BY level, label;

-- =============================================================================
-- VERIFY DATA SUMMARY
-- =============================================================================

SELECT
    level,
    COUNT(*) as meter_count,
    SUM(jan_26) as total_jan_26,
    SUM(dec_25) as total_dec_25
FROM "Water System"
GROUP BY level
ORDER BY level;
