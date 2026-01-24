-- =====================================================
-- Supabase Storage Bucket Setup for CSV Uploads
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Create the grafana-uploads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'grafana-uploads',
    'grafana-uploads',
    true,
    52428800, -- 50MB limit
    ARRAY['text/csv', 'application/vnd.ms-excel', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- RLS Policies for the grafana-uploads bucket
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to grafana-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to grafana-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon uploads to grafana-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from grafana-uploads" ON storage.objects;

-- Policy: Anyone can read files (public bucket)
CREATE POLICY "Allow public read access to grafana-uploads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'grafana-uploads');

-- Policy: Authenticated users can upload files
CREATE POLICY "Allow authenticated uploads to grafana-uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'grafana-uploads');

-- Policy: Anonymous users can also upload (for public app access)
CREATE POLICY "Allow anon uploads to grafana-uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'grafana-uploads');

-- Policy: Authenticated users can delete their uploads
CREATE POLICY "Allow authenticated delete from grafana-uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'grafana-uploads');

-- Policy: Anonymous users can also delete (for public app access)
CREATE POLICY "Allow anon delete from grafana-uploads"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'grafana-uploads');

-- =====================================================
-- Verify bucket was created
-- =====================================================
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'grafana-uploads';
