-- =====================================================
-- Water System: Sync with Airtable source of truth
-- Generated: 2026-04-07
-- Source: Airtable base appvmeThHxvhcbgcx (Water System-Yearly Consumption)
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. Standardize type name: "Un-Sold" → "Unsold" (match Airtable)
-- ─────────────────────────────────────────────────────
UPDATE "Water System"
SET type = 'Unsold'
WHERE type = 'Un-Sold';

-- Also update water_daily_consumption if it uses Un-Sold
UPDATE water_daily_consumption
SET type = 'Unsold'
WHERE type = 'Un-Sold';

-- ─────────────────────────────────────────────────────
-- 2. L1 Main Bulk (NAMA) — Account: C43659
--    Fix stale 2025 values + add Dec-25
-- ─────────────────────────────────────────────────────
UPDATE "Water System"
SET
    jan_25 = 32580,
    feb_25 = 44043,
    mar_25 = 49697,
    apr_25 = 31828,
    may_25 = 58425,
    jun_25 = 42998,
    jul_25 = 36909,
    aug_25 = 42221,
    sep_25 = 42088,
    oct_25 = 46049,
    nov_25 = 49118,
    dec_25 = 36733,
    jan_26 = 33666,
    feb_26 = 34758,
    mar_26 = 47219
WHERE account_number = 'C43659';

-- ─────────────────────────────────────────────────────
-- 3. L2 Zone Bulk Meters — Fix 2025 values + Dec-25
-- ─────────────────────────────────────────────────────

-- Zone FM (4300346)
UPDATE "Water System"
SET
    jan_25 = 2008, feb_25 = 1740, mar_25 = 1880, apr_25 = 1756,
    may_25 = 1693, jun_25 = 1673, jul_25 = 1960, aug_25 = 2305,
    sep_25 = 2089, oct_25 = 2002, nov_25 = 2059, dec_25 = 2130,
    jan_26 = 2271, feb_26 = 2193, mar_26 = 2412
WHERE account_number = '4300346';

-- Zone 3A (4300343)
UPDATE "Water System"
SET
    jan_25 = 4235, feb_25 = 4273, mar_25 = 3591, apr_25 = 3996,
    may_25 = 4898, jun_25 = 6566, jul_25 = 5949, aug_25 = 6207,
    sep_25 = 6440, oct_25 = 7219, nov_25 = 5208, dec_25 = 1483,
    jan_26 = 2616, feb_26 = 8545, mar_26 = 2867
WHERE account_number = '4300343';

-- Zone 3B (4300344)
UPDATE "Water System"
SET
    jan_25 = 3256, feb_25 = 2962, mar_25 = 3331, apr_25 = 935,
    may_25 = 3093, jun_25 = 3231, jul_25 = 3243, aug_25 = 2886,
    sep_25 = 16402, oct_25 = 5467, nov_25 = 11824, dec_25 = 2050,
    jan_26 = 5996, feb_26 = 5374, mar_26 = 2383
WHERE account_number = '4300344';

-- Zone 5 (4300345)
UPDATE "Water System"
SET
    jan_25 = 4267, feb_25 = 4231, mar_25 = 3862, apr_25 = 3663,
    may_25 = 3849, jun_25 = 4137, jul_25 = 3476, aug_25 = 3968,
    sep_25 = 4030, oct_25 = 4218, nov_25 = 4433, dec_25 = 4874,
    jan_26 = 4598, feb_26 = 3348, mar_26 = 4352
WHERE account_number = '4300345';

-- Zone 8 (4300342)
UPDATE "Water System"
SET
    jan_25 = 1547, feb_25 = 1498, mar_25 = 2605, apr_25 = 3138,
    may_25 = 2937, jun_25 = 3142, jul_25 = 3492, aug_25 = 3347,
    sep_25 = 3783, oct_25 = 3929, nov_25 = 3306, dec_25 = 3506,
    jan_26 = 2336, feb_26 = 2425, mar_26 = 2416
WHERE account_number = '4300342';

-- Village Square (4300335)
UPDATE "Water System"
SET
    jan_25 = 14, feb_25 = 12, mar_25 = 21, apr_25 = 13,
    may_25 = 18.8, jun_25 = 18.6, jul_25 = 60, aug_25 = 77,
    sep_25 = 81, oct_25 = 122, nov_25 = 126, dec_25 = 189,
    jan_26 = 249, feb_26 = 153, mar_26 = 176
WHERE account_number = '4300335';

-- Sales Center (4300295) — Airtable Water 26 shows DC/Retail
UPDATE "Water System"
SET
    jan_25 = 74.5, feb_25 = 62.9, mar_25 = 44.1, apr_25 = 65.5,
    may_25 = 63.1, jun_25 = 54.9, jul_25 = 59, aug_25 = 61,
    sep_25 = 87, oct_25 = 78, nov_25 = 78, dec_25 = 21,
    jan_26 = 152, feb_26 = 159, mar_26 = 163,
    level = 'DC',
    zone = 'Direct Connection',
    type = 'Retail'
WHERE account_number = '4300295';

-- ─────────────────────────────────────────────────────
-- 4. DC (Direct Connection) Meters — Fix 2025 + Dec-25
-- ─────────────────────────────────────────────────────

-- Hotel Main Building (4300334)
UPDATE "Water System"
SET
    jan_25 = 18048, feb_25 = 19482, mar_25 = 22151, apr_25 = 11667,
    may_25 = 26963, jun_25 = 17379, jul_25 = 14713, aug_25 = 16249,
    sep_25 = 13548, oct_25 = 18876, nov_25 = 18656, dec_25 = 18102,
    jan_26 = 17722, feb_26 = 13931, mar_26 = 12937
WHERE account_number = '4300334';

-- Al Adrak Camp (4300348)
UPDATE "Water System"
SET
    jan_25 = 1038, feb_25 = 702, mar_25 = 1161, apr_25 = 1000,
    may_25 = 1228, jun_25 = 1015, jul_25 = 972, aug_25 = 924,
    sep_25 = 860, oct_25 = 879, nov_25 = 875, dec_25 = 686,
    jan_26 = 833, feb_26 = 1094, mar_26 = 680
WHERE account_number = '4300348';

-- Al Adrak Company/Accommodation (4300349)
UPDATE "Water System"
SET
    jan_25 = 0, feb_25 = 0, mar_25 = 0, apr_25 = 0,
    may_25 = 1805, jun_25 = 1758, jul_25 = 1859, aug_25 = 1572,
    sep_25 = 1774, oct_25 = 1687, nov_25 = 1448, dec_25 = 1066,
    jan_26 = 1352, feb_26 = 1452, mar_26 = 1573
WHERE account_number = '4300349';

-- Community Mgmt / STP (4300336)
UPDATE "Water System"
SET
    jan_25 = 29.1, feb_25 = 37.1, mar_25 = 25.7, apr_25 = 35.1,
    may_25 = 28.5, jun_25 = 53.1, jul_25 = 50, aug_25 = 56,
    sep_25 = 55, oct_25 = 62, nov_25 = 42, dec_25 = 38,
    jan_26 = 40, feb_26 = 71, mar_26 = 62
WHERE account_number = '4300336';

-- Building Security (4300297)
UPDATE "Water System"
SET
    jan_25 = 17.1, feb_25 = 15.8, mar_25 = 15.1, apr_25 = 15.9,
    may_25 = 15.9, jun_25 = 13.4, jul_25 = 18, aug_25 = 16,
    sep_25 = 17, oct_25 = 20, nov_25 = 25, dec_25 = 27,
    jan_26 = 27, feb_26 = 26, mar_26 = 26
WHERE account_number = '4300297';

-- Building ROP (4300299)
UPDATE "Water System"
SET
    jan_25 = 22.4, feb_25 = 20.7, mar_25 = 19.6, apr_25 = 19.6,
    may_25 = 19.7, jun_25 = 16.9, jul_25 = 22, aug_25 = 20,
    sep_25 = 21, oct_25 = 23, nov_25 = 31, dec_25 = 31,
    jan_26 = 33, feb_26 = 31, mar_26 = 30
WHERE account_number = '4300299';

-- Phase 02 Main Entrance (4300338)
UPDATE "Water System"
SET
    jan_25 = 10.4, feb_25 = 8.23, mar_25 = 6.03, apr_25 = 6.44,
    may_25 = 6.09, jun_25 = 6.33, jul_25 = 7, aug_25 = 7,
    sep_25 = 8, oct_25 = 12, nov_25 = 10, dec_25 = 18,
    jan_26 = 16, feb_26 = 4, mar_26 = 5
WHERE account_number = '4300338';

-- Irrigation Tank 01 Inlet (4300323)
UPDATE "Water System"
SET
    jan_25 = 0, feb_25 = 0, mar_25 = 0, apr_25 = 0,
    may_25 = 2, jun_25 = 0, jul_25 = 1, aug_25 = 0,
    sep_25 = 0, oct_25 = 0, nov_25 = 0, dec_25 = 0,
    jan_26 = 0, feb_26 = 0, mar_26 = 0
WHERE account_number = '4300323';

-- Irrigation Tank 04 Z08 (4300294)
UPDATE "Water System"
SET
    jan_25 = 0, feb_25 = 0, mar_25 = 0, apr_25 = 0,
    may_25 = 0, jun_25 = 0, jul_25 = 1, aug_25 = 0,
    sep_25 = 0, oct_25 = 0, nov_25 = 0, dec_25 = 0,
    jan_26 = 0, feb_26 = 0, mar_26 = 1
WHERE account_number = '4300294';

-- Irrigation Controller UP (4300340) — N/A in Airtable 2026
UPDATE "Water System"
SET
    label = 'Irrigation- Controller UP (TSE Water)',
    level = 'N/A', zone = 'N/A', type = 'N/A',
    jan_25 = 0, feb_25 = 0, mar_25 = 0, apr_25 = 0,
    may_25 = 33, jun_25 = 491, jul_25 = 554, aug_25 = 272,
    sep_25 = 266, oct_25 = 181, nov_25 = 328, dec_25 = 253,
    jan_26 = 124, feb_26 = 75, mar_26 = 188
WHERE account_number = '4300340';

-- Irrigation Controller DOWN (4300341) — N/A in Airtable 2026
UPDATE "Water System"
SET
    label = 'Irrigation- Controller DOWN (TSE Water)',
    level = 'N/A', zone = 'N/A', type = 'N/A',
    jan_25 = 159, feb_25 = 239, mar_25 = 283, apr_25 = 0,
    may_25 = 910, jun_25 = 511, jul_25 = 611, aug_25 = 343,
    sep_25 = 0, oct_25 = 0, nov_25 = 0, dec_25 = 0,
    jan_26 = 0, feb_26 = 0, mar_26 = 0
WHERE account_number = '4300341';

-- ─────────────────────────────────────────────────────
-- 5. N/A Meters (TSE / Irrigation — not in loss calculations)
-- ─────────────────────────────────────────────────────

-- Irrigation Tank 01 Outlet (4300322) — upsert
-- Update if exists, otherwise insert
UPDATE "Water System"
SET
    label = 'Irrigation Tank 01 (Outlet (TSE Water))',
    level = 'N/A', zone = 'N/A', parent_meter = 'N/A', type = 'N/A',
    jan_25 = 27954, feb_25 = 29422, mar_25 = 26787, apr_25 = 13780,
    may_25 = 30126.9, jun_25 = 18885, jul_25 = 20290, aug_25 = 23295,
    sep_25 = 19002, oct_25 = 15136, nov_25 = 13998, dec_25 = 23239,
    jan_26 = 0, feb_26 = 0, mar_26 = 0
WHERE account_number = '4300322';

INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type,
    jan_25, feb_25, mar_25, apr_25, may_25, jun_25,
    jul_25, aug_25, sep_25, oct_25, nov_25, dec_25,
    jan_26, feb_26, mar_26)
SELECT
    'Irrigation Tank 01 (Outlet (TSE Water))', '4300322', 'N/A', 'N/A', 'N/A', 'N/A',
    27954, 29422, 26787, 13780, 30126.9, 18885,
    20290, 23295, 19002, 15136, 13998, 23239,
    0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number = '4300322');

-- Irrigation Tank VS / TSE (4300347) — upsert
UPDATE "Water System"
SET
    label = 'Irrigation Tank - VS (TSE Water)',
    level = 'N/A', zone = 'N/A', parent_meter = 'N/A', type = 'N/A',
    jan_25 = 934, feb_25 = 934, mar_25 = 855, apr_25 = 0,
    may_25 = 2698, jun_25 = 1164, jul_25 = 825, aug_25 = 1917,
    sep_25 = 1444, oct_25 = 1489, nov_25 = 1053, dec_25 = 749,
    jan_26 = 917, feb_26 = 697, mar_26 = 0
WHERE account_number = '4300347';

INSERT INTO "Water System" (label, account_number, level, zone, parent_meter, type,
    jan_25, feb_25, mar_25, apr_25, may_25, jun_25,
    jul_25, aug_25, sep_25, oct_25, nov_25, dec_25,
    jan_26, feb_26, mar_26)
SELECT
    'Irrigation Tank - VS (TSE Water)', '4300347', 'N/A', 'N/A', 'N/A', 'N/A',
    934, 934, 855, 0, 2698, 1164,
    825, 1917, 1444, 1489, 1053, 749,
    917, 697, 0
WHERE NOT EXISTS (SELECT 1 FROM "Water System" WHERE account_number = '4300347');

-- ─────────────────────────────────────────────────────
-- 6. Verify the updates
-- ─────────────────────────────────────────────────────
SELECT account_number, label, level, type, dec_25, jan_26, feb_26, mar_26
FROM "Water System"
WHERE level IN ('L1', 'L2', 'DC', 'N/A')
ORDER BY level, account_number;
