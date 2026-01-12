-- Virtual Try-On Feature - Database Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Step 1: Create profiles table for personal model storage
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  personal_model_url TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'non-binary')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create outfit_visualizations table for caching try-on images
CREATE TABLE IF NOT EXISTS outfit_visualizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  combination_hash TEXT NOT NULL UNIQUE,
  item_ids UUID[] NOT NULL,
  visualization_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Add gender column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'unisex'));

-- Step 4: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_outfit_visualizations_user_id ON outfit_visualizations(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_visualizations_hash ON outfit_visualizations(combination_hash);
CREATE INDEX IF NOT EXISTS idx_items_gender ON items(gender);

-- Step 5: Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_visualizations ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own visualizations" ON outfit_visualizations;
DROP POLICY IF EXISTS "Users can insert own visualizations" ON outfit_visualizations;
DROP POLICY IF EXISTS "Users can delete own visualizations" ON outfit_visualizations;

-- Step 7: Create RLS Policies for profiles table
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Step 8: Create RLS Policies for outfit_visualizations table
CREATE POLICY "Users can view own visualizations"
  ON outfit_visualizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visualizations"
  ON outfit_visualizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own visualizations"
  ON outfit_visualizations FOR DELETE
  USING (auth.uid() = user_id);

-- Step 9: Create trigger to update updated_at on profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create trigger for auto-creating profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Verification queries (run these to verify setup)
-- SELECT * FROM profiles LIMIT 1;
-- SELECT * FROM outfit_visualizations LIMIT 1;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'gender';
