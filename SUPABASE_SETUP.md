# Supabase Database Setup Guide

This guide will help you set up your Supabase database, storage buckets, and security policies for the OOTD AI app.

## Prerequisites

1. A Supabase account ([supabase.com](https://supabase.com))
2. A new Supabase project created
3. Your project URL and anon key (found in Settings → API)

## Step 1: Create Database Tables

Run the following SQL in your Supabase SQL Editor (Dashboard → SQL Editor):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  isolated_image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  color TEXT NOT NULL,
  material TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create outfits table
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_ids UUID[] NOT NULL CHECK (array_length(item_ids, 1) = 3),
  occasion TEXT,
  weather TEXT,
  gemini_suggestion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_outfits_user_id ON outfits(user_id);
CREATE INDEX idx_outfits_created_at ON outfits(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for items table
CREATE POLICY "Users can view own items"
  ON items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for outfits table
CREATE POLICY "Users can view own outfits"
  ON outfits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfits"
  ON outfits FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Step 2: Create Storage Buckets

1. Go to **Storage** in your Supabase dashboard
2. Create two buckets:

### Bucket 1: `wardrobe-images`
- **Public**: No (private)
- **File size limit**: 10MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/heic`

### Bucket 2: `isolated-images`
- **Public**: No (private)
- **File size limit**: 5MB
- **Allowed MIME types**: `image/png`

## Step 3: Set Up Storage Policies

Run this SQL in the SQL Editor to create storage policies:

```sql
-- Policy for wardrobe-images bucket
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

-- Policy for isolated-images bucket
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
```

## Step 4: Enable Email Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Email** provider
3. Configure email templates (optional, defaults work fine)
4. Set up email confirmation (optional for development)

## Step 5: Verify Setup

1. Check that both tables exist: `items` and `outfits`
2. Verify RLS is enabled on both tables
3. Confirm both storage buckets exist
4. Test authentication by creating a test user

## Troubleshooting

### "relation does not exist" error
- Make sure you ran the CREATE TABLE statements
- Check that you're in the correct database

### "permission denied" errors
- Verify RLS policies are created correctly
- Check that the user is authenticated
- Ensure storage policies match the bucket names exactly

### Storage upload fails
- Verify bucket names match exactly: `wardrobe-images` and `isolated-images`
- Check storage policies are applied
- Ensure file paths follow the pattern: `{user_id}/{item_id}/filename`

## Next Steps

After completing this setup:
1. Add your Supabase URL and anon key to `.env`
2. Test the app by signing up a new user
3. Try uploading an item to verify the complete flow
