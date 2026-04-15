-- RLS Policies for Supabase Storage Bucket 'logo'
-- This file contains SQL commands to configure Row Level Security policies for the 'logo' bucket
-- Run this in your Supabase SQL Editor or via CLI

-- First, ensure the bucket exists (if not already created via dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logo', 'logo', true) ON CONFLICT DO NOTHING;

-- Enable RLS on storage.objects (if not already enabled)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload/insert objects into 'logo' bucket
CREATE POLICY "Allow authenticated users to upload to logo bucket" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logo'
  AND auth.uid()::text IS NOT NULL
);

-- Policy: Allow authenticated users to update objects in 'logo' bucket
CREATE POLICY "Allow authenticated users to update logo bucket" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logo'
  AND auth.uid()::text IS NOT NULL
);

-- Policy: Allow authenticated users to delete objects from 'logo' bucket
CREATE POLICY "Allow authenticated users to delete from logo bucket" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logo'
  AND auth.uid()::text IS NOT NULL
);

-- Policy: Allow public access to view/download objects from 'logo' bucket (for displaying logos)
CREATE POLICY "Allow public to view logo bucket" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logo');

-- Optional: Restrict to admin role only for upload/update/delete
-- Uncomment and modify if you want to restrict to admin users only
-- Note: This requires checking user role in a custom function or joining with users table

-- CREATE OR REPLACE FUNCTION auth.is_admin()
-- RETURNS boolean AS $$
-- BEGIN
--   RETURN EXISTS (
--     SELECT 1 FROM users
--     WHERE supabase_user_id = auth.uid()::text
--     AND role = 'administrator'
--   );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE POLICY "Allow admin users to upload to logo bucket" ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'logo'
--   AND auth.is_admin()
-- );

-- CREATE POLICY "Allow admin users to update logo bucket" ON storage.objects
-- FOR UPDATE
-- TO authenticated
-- USING (
--   bucket_id = 'logo'
--   AND auth.is_admin()
-- );

-- CREATE POLICY "Allow admin users to delete from logo bucket" ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'logo'
--   AND auth.is_admin()
-- );