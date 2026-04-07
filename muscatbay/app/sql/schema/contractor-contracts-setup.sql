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
    updated_at    TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT contractor_contracts_unique
        UNIQUE (contractor, contract_ref),
    CONSTRAINT contractor_contracts_flow_check
        CHECK (flow IN ('Expense', 'Revenue'))
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
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT yearly_costs_unique
        UNIQUE (contractor, contract_year)
);

-- ──────────────────────────────────────────────────────────────
-- Trigger: auto-update updated_at on row modification
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contractor_contracts_updated_at
    BEFORE UPDATE ON contractor_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_contractor_yearly_costs_updated_at
    BEFORE UPDATE ON contractor_yearly_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
