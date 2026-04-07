-- ============================================================
-- Contractor Contracts & Yearly Costs — Data Insertion
-- Run AFTER contractor-contracts-setup.sql
-- Safe to re-run: uses ON CONFLICT DO NOTHING
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Per-Contract Summary (14 contracts)
-- ──────────────────────────────────────────────────────────────
-- Delete existing rows so we can re-insert with correct names
DELETE FROM contractor_contracts;

INSERT INTO contractor_contracts
    (contractor, contract_ref, service, flow, status, contract_years, annual_value_omr, total_value_omr, rate_note, note)
VALUES
    -- Expense contracts (match amc_contractor_summary names exactly)
    ('KONE Assarain LLC',           '0042356335',        'Elevator Maintenance',                   'Expense', 'Active', 2, 11550.00,    23100.00,    NULL, NULL),
    ('OWATCO',                      'CO-SBJ-24-0231',    'STP Operation & Maintenance',            'Expense', 'Active', 5, 37245.40,    199496.08,   NULL, 'Annual escalates: 37,245.60 → 41,933.11'),
    ('Kalhat Services & Trading',   'CO-SBJ-24-0232',    'Facility Management (FM)',               'Expense', 'Active', 5, 386409.72,   1932048.59,  NULL, NULL),
    ('Future Cities (Tadoom)',      'Jun-2022 Agreement', 'Smart Water Meters & Billing',           'Expense', 'Active', 8, 2211.60,     17692.80,    NULL, NULL),
    ('Muna Noor International',     'CO-SBJ-24-0235',    'Pest Control Services',                  'Expense', 'Active', 2, 1680.00,     3360.00,     NULL, NULL),
    ('Gulf Expert',                 'GE-2025-BMS',       'Chillers, BMS & Pressurisation',         'Expense', 'Active', 1, 7234.50,     7234.50,     NULL, NULL),
    ('Gulf Expert',                 'GE-2025-HVAC',      'BMS AMC FM & Staff Accommodation',       'Expense', 'Active', 1, 26460.00,    26460.00,    NULL, NULL),
    ('BEC (Bahwan Engineering)',     'MIS-SBJ-25-077',   'Fire Alarm & Fire Fighting',             'Expense', 'Active', 2, 7612.50,     15225.00,    NULL, NULL),
    ('National Marine Services',    'PO Based',          'Diving Services',                        'Expense', 'Active', 2, 57093.12,    114186.24,   NULL, NULL),
    ('Muscat Electronics',          'PO Based',          'Daikin AC (Sale Center)',                 'Expense', 'Active', 1, 10461.84,    10461.84,    NULL, NULL),
    ('Iron Mountain / ARAMEX',      'Schedule Based',    'Offsite Record Storage',                 'Expense', 'Active', 1, 0.00,        0.00,        NULL, NULL),
    ('Al Khalili',                  'AK-2025-CCTV',      'CCTV Contract',                          'Expense', 'Active', 5, 13995.66,    69978.30,    NULL, NULL),
    -- Revenue contracts
    ('Abraj Al Wattaya Trading',    'SBJ-CO-RE-004-26',  'Sewage Tanker Discharging (STP)',        'Revenue', 'Active', 1, NULL,         NULL,        'Per Load (OMR 5)', 'Dec 2025 → Nov 2026, revenue depends on loads delivered'),
    ('Al Zawahar Trading',          'SBJ-CO-RE-005-26',  'Sewage Tanker Discharging (STP)',        'Revenue', 'Active', 1, NULL,         NULL,        'Per Load (OMR 5)', 'Dec 2025 → Nov 2026, revenue depends on loads delivered')
ON CONFLICT ON CONSTRAINT contractor_contracts_unique DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 2. Year-by-Year Expense Breakdown
-- ──────────────────────────────────────────────────────────────
-- Delete existing rows so we can re-insert with correct names
DELETE FROM contractor_yearly_costs;

INSERT INTO contractor_yearly_costs
    (contractor, contract_year, year_label, amount_omr)
VALUES
    -- Year 1 (2024/2025)
    ('OWATCO',                      1, '2024/2025', 37245.60),
    ('Kalhat Services & Trading',   1, '2024/2025', 386409.72),
    ('Muna Noor International',     1, '2024/2025', 1680.00),
    ('Future Cities (Tadoom)',      1, '2024/2025', 2211.60),
    ('National Marine Services',    1, '2024/2025', 57093.12),

    -- Year 2 (2025/2026)
    ('OWATCO',                      2, '2025/2026', 38757.82),
    ('Kalhat Services & Trading',   2, '2025/2026', 386409.72),
    ('BEC (Bahwan Engineering)',     2, '2025/2026', 7612.50),
    ('Gulf Expert',                 2, '2025/2026', 33694.50),  -- BMS 7,234.50 + HVAC 26,460.00
    ('Muna Noor International',     2, '2025/2026', 1680.00),
    ('Future Cities (Tadoom)',      2, '2025/2026', 2211.60),
    ('National Marine Services',    2, '2025/2026', 57093.12),
    ('Muscat Electronics',          2, '2025/2026', 10461.84),
    ('Al Khalili',                  2, '2025/2026', 13995.66),
    ('Iron Mountain / ARAMEX',      2, '2025/2026', 0),

    -- Year 3 (2026/2027)
    ('OWATCO',                      3, '2026/2027', 40269.54),
    ('Kalhat Services & Trading',   3, '2026/2027', 386409.72),
    ('KONE Assarain LLC',           3, '2026/2027', 11550.00),
    ('BEC (Bahwan Engineering)',     3, '2026/2027', 7612.50),
    ('Future Cities (Tadoom)',      3, '2026/2027', 2211.60),
    ('Al Khalili',                  3, '2026/2027', 13995.66),

    -- Year 4 (2027/2028)
    ('OWATCO',                      4, '2027/2028', 41290.01),
    ('Kalhat Services & Trading',   4, '2027/2028', 386409.72),
    ('KONE Assarain LLC',           4, '2027/2028', 11550.00),
    ('Future Cities (Tadoom)',      4, '2027/2028', 2211.60),
    ('Al Khalili',                  4, '2027/2028', 13995.66),

    -- Year 5 (2028/2029)
    ('OWATCO',                      5, '2028/2029', 41933.11),
    ('Kalhat Services & Trading',   5, '2028/2029', 386409.72),
    ('Future Cities (Tadoom)',      5, '2028/2029', 2211.60),
    ('Al Khalili',                  5, '2028/2029', 13995.66),

    -- Year 6 (2029/2030)
    ('Kalhat Services & Trading',   6, '2029/2030', 386409.72),
    ('Future Cities (Tadoom)',      6, '2029/2030', 2211.60),
    ('Al Khalili',                  6, '2029/2030', 13995.66),

    -- Year 7 (2030/2031)
    ('Future Cities (Tadoom)',      7, '2030/2031', 2211.60),

    -- Year 8 (2031/2032)
    ('Future Cities (Tadoom)',      8, '2031/2032', 2211.60)
ON CONFLICT ON CONSTRAINT yearly_costs_unique DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- Verify
-- ──────────────────────────────────────────────────────────────
SELECT 'contractor_contracts' AS tbl, COUNT(*) AS rows FROM contractor_contracts
UNION ALL
SELECT 'contractor_yearly_costs', COUNT(*) FROM contractor_yearly_costs;
