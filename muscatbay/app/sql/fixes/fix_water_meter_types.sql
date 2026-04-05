-- ============================================================
-- Fix Water Meter Types — Update meter classifications
-- Run against the Supabase "Water System" table
-- Safe to re-run: idempotent UPDATE statements
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Change Residential (Villa) → Un-Sold for unsold units
-- ──────────────────────────────────────────────────────────────
UPDATE "Water System"
SET type = 'Un-Sold'
WHERE account_number IN (
    '4300083',  -- Z3-18 (Villa)
    '4300093',  -- Z3-25 (Villa)
    '4300095',  -- Z3-26 (Villa)
    '4300151',  -- Z5-6
    '4300159',  -- Z5-33
    '4300160',  -- Z5-29
    '4300167',  -- Z5 024
    '4300173',  -- Z5-11
    '4300188',  -- Z8-1
    '4300191',  -- Z8-4
    '4300192',  -- Z8-6
    '4300193',  -- Z8-7
    '4300194',  -- Z8-8
    '4300195'   -- Z8-10
);

-- ──────────────────────────────────────────────────────────────
-- 2. Change Residential (Apart) → Un-Sold for unsold building unit
-- ──────────────────────────────────────────────────────────────
UPDATE "Water System"
SET type = 'Un-Sold'
WHERE account_number = '4300237';  -- Z3-56(1A) (Building)

-- ──────────────────────────────────────────────────────────────
-- 3. Sales Center Common Building: Zone Bulk → MB_Common, L2 → DC
-- ──────────────────────────────────────────────────────────────
UPDATE "Water System"
SET type = 'MB_Common',
    level = 'DC'
WHERE account_number = '4300295';  -- Sales Center Common Building

-- ──────────────────────────────────────────────────────────────
-- 4. Cabinet FM: Building → MB_Common
-- ──────────────────────────────────────────────────────────────
UPDATE "Water System"
SET type = 'MB_Common'
WHERE account_number = '4300337';  -- Cabinet FM (CONTRACTORS OFFICE)

-- ──────────────────────────────────────────────────────────────
-- 5. Irrigation Controller UP (TSE): set to N/A
-- ──────────────────────────────────────────────────────────────
UPDATE "Water System"
SET label = 'Irrigation- Controller UP (TSE)',
    level = 'N/A',
    zone = 'N/A',
    type = 'N/A'
WHERE account_number = '4300340';

-- Also update Daily Water Consumption table if it exists
UPDATE "Daily Water Consumption"
SET label = 'Irrigation- Controller UP (TSE)',
    level = 'N/A',
    zone = 'N/A',
    type = 'N/A'
WHERE account_number = '4300340';
