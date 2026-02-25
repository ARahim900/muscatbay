-- =====================================================
-- Create professional_applications table
-- For contractor/professional service provider applications
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop table if exists (for clean re-creation)
DROP TABLE IF EXISTS professional_applications CASCADE;

-- Step 2: Create the professional_applications table
CREATE TABLE professional_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    service_category TEXT NOT NULL,
    registration_number TEXT,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for common queries
CREATE INDEX idx_professional_applications_email ON professional_applications (email);
CREATE INDEX idx_professional_applications_status ON professional_applications (status);
CREATE INDEX idx_professional_applications_service ON professional_applications (service_category);
CREATE INDEX idx_professional_applications_submitted ON professional_applications (submitted_at DESC);

-- Step 4: Enable RLS
ALTER TABLE professional_applications ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies

-- Allow anonymous users to insert new applications
CREATE POLICY "Allow anonymous insert applications" ON professional_applications
    FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated users (admin) to view all applications
CREATE POLICY "Allow authenticated read all applications" ON professional_applications
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users (admin) to update applications
CREATE POLICY "Allow authenticated update applications" ON professional_applications
    FOR UPDATE TO authenticated USING (true);

-- Allow users to view their own application by email (via RPC function if needed)
-- Note: For public status checking, consider using an RPC function with email verification

-- Step 6: Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_professional_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for automatic updated_at
CREATE TRIGGER trigger_update_professional_applications_timestamp
    BEFORE UPDATE ON professional_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_professional_applications_updated_at();

-- Step 8: Add comment for documentation
COMMENT ON TABLE professional_applications IS 'Stores contractor and professional service provider applications for Muscat Bay access';

-- Done! The table is ready to receive professional applications.
