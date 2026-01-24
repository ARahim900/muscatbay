-- =====================================================
-- FIX Row Level Security for Water System Table
-- Run this script in Supabase SQL Editor
-- =====================================================

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous read access" ON "Water System";
DROP POLICY IF EXISTS "Allow anonymous insert" ON "Water System";
DROP POLICY IF EXISTS "Allow anonymous update" ON "Water System";
DROP POLICY IF EXISTS "Allow anonymous delete" ON "Water System";

-- Option 1: Disable RLS entirely (simplest for public data)
-- ALTER TABLE "Water System" DISABLE ROW LEVEL SECURITY;

-- Option 2: Keep RLS but add permissive policies
-- Enable RLS first (if not already enabled)
ALTER TABLE "Water System" ENABLE ROW LEVEL SECURITY;

-- Create policies that allow operations for authenticated users only
CREATE POLICY "Allow authenticated read access" ON "Water System"
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert access" ON "Water System"
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update access" ON "Water System"
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated delete access" ON "Water System"
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'Water System';

-- Verify data count
SELECT COUNT(*) as total_meters FROM "Water System";
