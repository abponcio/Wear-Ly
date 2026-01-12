-- Add missing UPDATE policy for outfit_visualizations table
-- This is required for the upsert operation when regenerating try-on images

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can update own visualizations" ON outfit_visualizations;

-- Create UPDATE policy for outfit_visualizations
CREATE POLICY "Users can update own visualizations"
  ON outfit_visualizations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verification: Check that the policy exists
-- SELECT * FROM pg_policies WHERE tablename = 'outfit_visualizations';
