-- ============================================================
-- Add contract_pdf_url column to contractor tables
-- Stores Google Drive share link for contract PDF documents
-- Run in Supabase SQL Editor
-- ============================================================

-- Add to contractor_contracts (new schema)
ALTER TABLE contractor_contracts
ADD COLUMN IF NOT EXISTS contract_pdf_url TEXT;

-- Add to Contractor_Tracker (legacy AMC table)
ALTER TABLE "Contractor_Tracker"
ADD COLUMN IF NOT EXISTS contract_pdf_url TEXT;

-- Verify
SELECT 'contract_pdf_url column added to contractor_contracts' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_contracts' AND column_name = 'contract_pdf_url'
);

SELECT 'contract_pdf_url column added to Contractor_Tracker' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Contractor_Tracker' AND column_name = 'contract_pdf_url'
);
