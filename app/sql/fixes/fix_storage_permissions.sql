-- TRY FIXING STORAGE PERMISSIONS
-- Run this script to attempt fixing storage permissions via SQL.
-- If this fails with "must be owner of table objects", you MUST use the Supabase Dashboard instructions provided.

-- 1. Create the 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Policy to allow Public Access (Download/View)
-- Uses DO block to handle errors gracefully if policy exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Give public access to avatars'
    ) THEN
        CREATE POLICY "Give public access to avatars" ON storage.objects
        FOR SELECT
        USING (bucket_id = 'avatars');
    END IF;
END $$;

-- 3. Create Policy to allow Authenticated Uploads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated uploads to avatars'
    ) THEN
        CREATE POLICY "Allow authenticated uploads to avatars" ON storage.objects
        FOR INSERT 
        TO authenticated 
        WITH CHECK (bucket_id = 'avatars');
    END IF;
END $$;

-- 4. Create Policy to allow Authenticated Updates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated updates to avatars'
    ) THEN
        CREATE POLICY "Allow authenticated updates to avatars" ON storage.objects
        FOR UPDATE
        TO authenticated 
        USING (bucket_id = 'avatars');
    END IF;
END $$;

SELECT 'Storage Policies Attempted' as status;
