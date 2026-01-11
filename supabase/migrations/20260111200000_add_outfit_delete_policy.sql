-- Add DELETE policy for outfits table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can delete own outfits" ON outfits;

-- Create DELETE policy for outfits table
CREATE POLICY "Users can delete own outfits"
  ON outfits FOR DELETE
  USING (auth.uid() = user_id);

-- Verification: Check that the policy was created
-- SELECT * FROM pg_policies WHERE tablename = 'outfits';
