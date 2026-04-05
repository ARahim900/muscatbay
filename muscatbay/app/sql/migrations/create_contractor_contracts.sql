-- ============================================================
-- Contractor Contracts & Yearly Costs Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- Table 1: contractor_contracts — Per-contract summary (14 rows)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contractor_contracts (
    id            SERIAL PRIMARY KEY,
    contractor    TEXT NOT NULL,
    contract_ref  TEXT,
    service       TEXT,
    flow          TEXT NOT NULL DEFAULT 'Expense',   -- 'Expense' | 'Revenue'
    status        TEXT NOT NULL DEFAULT 'Active',
    contract_years INTEGER,
    annual_value_omr  NUMERIC(12,2),
    total_value_omr   NUMERIC(12,2),
    rate_note     TEXT,                              -- e.g. 'OMR 5.000 per load'
    note          TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT contractor_contracts_unique
        UNIQUE (contractor, contract_ref)
);

-- ──────────────────────────────────────────────────────────────
-- Table 2: contractor_yearly_costs — Year-by-year breakdown
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contractor_yearly_costs (
    id              SERIAL PRIMARY KEY,
    contractor      TEXT NOT NULL,
    contract_year   INTEGER NOT NULL,     -- 1, 2, 3 …
    year_label      TEXT NOT NULL,         -- '2024/2025', '2025/2026' …
    amount_omr      NUMERIC(12,2),
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT yearly_costs_unique
        UNIQUE (contractor, contract_year)
);

-- ──────────────────────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contracts_flow     ON contractor_contracts (flow);
CREATE INDEX IF NOT EXISTS idx_contracts_status   ON contractor_contracts (status);
CREATE INDEX IF NOT EXISTS idx_yearly_contractor  ON contractor_yearly_costs (contractor);
CREATE INDEX IF NOT EXISTS idx_yearly_year        ON contractor_yearly_costs (contract_year);

-- ──────────────────────────────────────────────────────────────
-- Row Level Security (allow authenticated read)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE contractor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_yearly_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow authenticated read contractor_contracts"
    ON contractor_contracts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated read contractor_yearly_costs"
    ON contractor_yearly_costs FOR SELECT
    TO authenticated
    USING (true);

-- Also allow anon read for development
CREATE POLICY IF NOT EXISTS "Allow anon read contractor_contracts"
    ON contractor_contracts FOR SELECT
    TO anon
    USING (true);

CREATE POLICY IF NOT EXISTS "Allow anon read contractor_yearly_costs"
    ON contractor_yearly_costs FOR SELECT
    TO anon
    USING (true);

-- Verify
SELECT 'contractor_contracts created' AS status;
SELECT 'contractor_yearly_costs created' AS status;


-- ============================================================
-- Contractor Contracts & Yearly Costs — Data Insertion
-- Safe to re-run: uses ON CONFLICT DO NOTHING
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Per-Contract Summary (14 contracts)
-- ──────────────────────────────────────────────────────────────
INSERT INTO contractor_contracts
    (contractor, contract_ref, service, flow, status, contract_years, annual_value_omr, total_value_omr, rate_note, note)
VALUES
    -- Expense contracts
    ('KONE Assarain LLC',      '0042356335',       'Lift Maintenance Services',              'Expense', 'Active', 2, 11550.00,    23100.00,    NULL, NULL),
    ('OWATCO',                 'CO-SBJ-24-0231',   'STP Operations & Maintenance',           'Expense', 'Active', 5, NULL,         199496.08,   NULL, 'Annual escalates: 37,245.60 → 41,933.11'),
    ('Kalhat Services',        'CO-SBJ-24-0232',   'Facility Management (FM)',               'Expense', 'Active', 5, 386409.72,   1932048.59,  NULL, NULL),
    ('Tadoom',                 'Jun-2022 Agreement','Water Supply',                           'Expense', 'Active', 8, 2211.60,     17692.80,    NULL, NULL),
    ('Muna Noor',              'CO-SBJ-24-0235',   'Pest Control Services',                  'Expense', 'Active', 2, 1680.00,     3360.00,     NULL, NULL),
    ('Gulf Expert (HVAC)',     'GE-2025-HVAC',     'HVAC Maintenance',                       'Expense', 'Active', 1, 7234.50,     7234.50,     NULL, NULL),
    ('Gulf Expert (BMS)',      'GE-2025-BMS',      'BMS Maintenance',                        'Expense', 'Active', 1, 26460.00,    26460.00,    NULL, NULL),
    ('BEC (Fire)',             'MIS-SBJ-25-077',   'Fire Alarm & Fire Fighting',             'Expense', 'Active', 2, 7612.50,     15225.00,    NULL, NULL),
    ('National Marine',        'PO Based',         'Marine Dredging Services',               'Expense', 'Active', 2, 57093.12,    114186.24,   NULL, NULL),
    ('Muscat Electronics',     'PO Based',         'AC Maintenance',                         'Expense', 'Active', 1, 10461.84,    10461.84,    NULL, NULL),
    ('Iron Mountain',          'Schedule Based',   'Offsite Record Storage',                 'Expense', 'Active', 1, NULL,         NULL,        'Variable', NULL),
    ('Al Khalili',             'AK-2025-CCTV',     'CCTV Access Control',                    'Expense', 'Active', 5, 13995.66,    69978.30,    NULL, NULL),
    -- Revenue contracts
    ('Abraj Al Wattaya',       'SBJ-CO-RE-004-26', 'Sewage Tanker Discharge',               'Revenue', 'Active', 1, NULL,         NULL,        'OMR 5.000 per load', 'Dec 2025 → Nov 2026, revenue depends on loads delivered'),
    ('Al Zawahar Trading',     'SBJ-CO-RE-005-26', 'Sewage Tanker Discharge',               'Revenue', 'Active', 1, NULL,         NULL,        'OMR 5.000 per load', 'Dec 2025 → Nov 2026, revenue depends on loads delivered')
ON CONFLICT ON CONSTRAINT contractor_contracts_unique DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 2. Year-by-Year Expense Breakdown
-- ──────────────────────────────────────────────────────────────
INSERT INTO contractor_yearly_costs
    (contractor, contract_year, year_label, amount_omr)
VALUES
    -- Year 1 (2024/2025)
    ('OWATCO',              1, '2024/2025', 37245.60),
    ('Kalhat Services',     1, '2024/2025', 386409.72),
    ('Muna Noor',           1, '2024/2025', 1680.00),
    ('Tadoom',              1, '2024/2025', 2211.60),
    ('National Marine',     1, '2024/2025', 57093.12),

    -- Year 2 (2025/2026)
    ('OWATCO',              2, '2025/2026', 38757.82),
    ('Kalhat Services',     2, '2025/2026', 386409.72),
    ('BEC (Fire)',          2, '2025/2026', 7612.50),
    ('Gulf Expert (HVAC)',  2, '2025/2026', 7234.50),
    ('Gulf Expert (BMS)',   2, '2025/2026', 26460.00),
    ('Muna Noor',           2, '2025/2026', 1680.00),
    ('Tadoom',              2, '2025/2026', 2211.60),
    ('National Marine',     2, '2025/2026', 57093.12),
    ('Muscat Electronics',  2, '2025/2026', 10461.84),
    ('Al Khalili',          2, '2025/2026', 13995.66),
    ('Iron Mountain',       2, '2025/2026', 0),

    -- Year 3 (2026/2027)
    ('OWATCO',              3, '2026/2027', 40269.54),
    ('Kalhat Services',     3, '2026/2027', 386409.72),
    ('KONE Assarain LLC',   3, '2026/2027', 11550.00),
    ('BEC (Fire)',          3, '2026/2027', 7612.50),
    ('Tadoom',              3, '2026/2027', 2211.60),
    ('Al Khalili',          3, '2026/2027', 13995.66),

    -- Year 4 (2027/2028)
    ('OWATCO',              4, '2027/2028', 41290.01),
    ('Kalhat Services',     4, '2027/2028', 386409.72),
    ('KONE Assarain LLC',   4, '2027/2028', 11550.00),
    ('Tadoom',              4, '2027/2028', 2211.60),
    ('Al Khalili',          4, '2027/2028', 13995.66),

    -- Year 5 (2028/2029)
    ('OWATCO',              5, '2028/2029', 41933.11),
    ('Kalhat Services',     5, '2028/2029', 386409.72),
    ('Tadoom',              5, '2028/2029', 2211.60),
    ('Al Khalili',          5, '2028/2029', 13995.66),

    -- Year 6 (2029/2030)
    ('Kalhat Services',     6, '2029/2030', 386409.72),
    ('Tadoom',              6, '2029/2030', 2211.60),
    ('Al Khalili',          6, '2029/2030', 13995.66),

    -- Year 7 (2030/2031)
    ('Tadoom',              7, '2030/2031', 2211.60),

    -- Year 8 (2031/2032)
    ('Tadoom',              8, '2031/2032', 2211.60)
ON CONFLICT ON CONSTRAINT yearly_costs_unique DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- Verify
-- ──────────────────────────────────────────────────────────────
SELECT 'contractor_contracts' AS tbl, COUNT(*) AS rows FROM contractor_contracts
UNION ALL
SELECT 'contractor_yearly_costs', COUNT(*) FROM contractor_yearly_costs;
