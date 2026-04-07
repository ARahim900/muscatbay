-- ============================================================
-- Migration: Remove Zone_SC, reclassify meters to Direct Connection
-- Date: 2026-04-07
-- ============================================================

BEGIN;

-- 1. Account 4300295 (Sales Center Common Building)
--    zone: Zone_SC → Direct Connection
--    type: MB_Common → Retail
UPDATE "Water System"
SET zone = 'Direct Connection',
    type = 'Retail'
WHERE account_number = '4300295';

-- 2. Account 4300328 (Sale Centre Caffe & Bar)
--    zone: Zone_SC → Zone_VS (Village Square)
--    parent_meter: Sale Centre (Zone Bulk) → Village Square (Zone Bulk)
UPDATE "Water System"
SET zone = 'Zone_VS',
    parent_meter = 'Village Square (Zone Bulk)'
WHERE account_number = '4300328';

-- 3. Update daily consumption table for both meters
UPDATE water_daily_consumption
SET zone = 'Direct Connection',
    type = 'Retail'
WHERE account_number = '4300295';

UPDATE water_daily_consumption
SET zone = 'Zone_VS',
    parent_meter = 'Village Square (Zone Bulk)'
WHERE account_number = '4300328';

-- 4. Remove Sales Center water loss data (zone no longer exists)
DELETE FROM water_loss_daily
WHERE zone = 'Sales Center';

DELETE FROM water_loss_summary
WHERE zone = 'Sales Center';

COMMIT;
