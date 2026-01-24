-- FIX RLS POLICIES (Application Tables Only)
-- This script enables Read/Write access for your application tables.
-- It excludes 'storage.objects' to avoid permission errors (manage those in Supabase Dashboard).

-- 1. STP Operations
ALTER TABLE stp_operations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access" ON stp_operations;
DROP POLICY IF EXISTS "Allow public read access" ON stp_operations;
CREATE POLICY "Allow authenticated access" ON stp_operations FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Electricity Meters & Readings
ALTER TABLE electricity_meters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access" ON electricity_meters;
DROP POLICY IF EXISTS "Allow public read access" ON electricity_meters;
CREATE POLICY "Allow authenticated access" ON electricity_meters FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE electricity_readings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access" ON electricity_readings;
DROP POLICY IF EXISTS "Allow public read access" ON electricity_readings;
CREATE POLICY "Allow authenticated access" ON electricity_readings FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Contractor Tracker
ALTER TABLE "Contractor_Tracker" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access" ON "Contractor_Tracker";
CREATE POLICY "Allow authenticated access" ON "Contractor_Tracker" FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Water System
ALTER TABLE "Water System" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access" ON "Water System";
CREATE POLICY "Allow authenticated access" ON "Water System" FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Verify
SELECT 'RLS Policies Updated (Access Granted)' as status;
