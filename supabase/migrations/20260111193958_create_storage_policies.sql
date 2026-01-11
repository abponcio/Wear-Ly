-- OOTD AI - Supabase Storage Policies
-- Run this AFTER creating the storage buckets in Supabase Dashboard
-- Go to Storage → Create buckets: "wardrobe-images" and "isolated-images"

-- Step 1: Enable RLS on storage.objects (if not already enabled)
-- Note: This may require superuser permissions. If it fails, RLS is likely already enabled.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own isolated images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own isolated images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own isolated images" ON storage.objects;

-- Step 3: Policies for wardrobe-images bucket
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wardrobe-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'wardrobe-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wardrobe-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 4: Policies for isolated-images bucket
CREATE POLICY "Users can upload own isolated images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'isolated-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own isolated images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'isolated-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own isolated images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'isolated-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verification (check policies exist)
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
