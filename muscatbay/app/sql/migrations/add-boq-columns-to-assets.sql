-- Add BOQ (Bill of Quantities) and Reserve Fund columns to Assets_Register_Database
-- These columns come from the Assets_Register_Tracker_v2_Reserve_Fund_Enriched.xlsx

ALTER TABLE "Assets_Register_Database"
ADD COLUMN IF NOT EXISTS "BOQ_Project_Ref"            TEXT,
ADD COLUMN IF NOT EXISTS "BOQ_Category_Design_Life"   NUMERIC,
ADD COLUMN IF NOT EXISTS "BOQ_Unit_Cost_OMR"          NUMERIC,
ADD COLUMN IF NOT EXISTS "Current_Replacement_Cost_OMR" NUMERIC;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Assets_Register_Database'
  AND column_name IN ('BOQ_Project_Ref','BOQ_Category_Design_Life','BOQ_Unit_Cost_OMR','Current_Replacement_Cost_OMR')
ORDER BY column_name;
