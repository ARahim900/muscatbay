-- ================================================
-- FIX RLS POLICIES FOR ELECTRICITY
-- ================================================

-- 1. Enable RLS (if not already enabled)
ALTER TABLE electricity_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE electricity_readings ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON electricity_meters;
DROP POLICY IF EXISTS "Allow public read access" ON electricity_readings;

-- 3. Create policies for Authenticated Read Access
CREATE POLICY "Allow authenticated read access" ON electricity_meters
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated read access" ON electricity_readings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 4. Verify
SELECT count(*) as meters_count FROM electricity_meters;
