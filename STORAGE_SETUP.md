# Storage Buckets Setup

The database tables and policies have been successfully created via Supabase CLI! ✅

## Next Step: Create Storage Buckets

You need to create the storage buckets manually in the Supabase Dashboard:

1. Go to your Supabase Dashboard → **Storage**
2. Click **New bucket**

### Create Bucket 1: `wardrobe-images`
- **Name**: `wardrobe-images` (exact match, lowercase)
- **Public bucket**: ❌ Unchecked (private)
- **File size limit**: `10485760` (10MB in bytes)
- **Allowed MIME types**: `image/jpeg,image/png,image/heic`
- Click **Create bucket**

### Create Bucket 2: `isolated-images`
- **Name**: `isolated-images` (exact match, lowercase)
- **Public bucket**: ❌ Unchecked (private)
- **File size limit**: `5242880` (5MB in bytes)
- **Allowed MIME types**: `image/png`
- Click **Create bucket**

## Storage Policies

The storage policies have already been applied via migration! They will automatically work once you create the buckets above.

## Verification

After creating the buckets, you can verify everything works by:
1. Signing up/logging in to your app
2. Uploading a test item
3. Checking Storage → `wardrobe-images` to see your uploaded image

## What's Already Done ✅

- ✅ Database tables (`items`, `outfits`) created
- ✅ RLS policies for tables configured
- ✅ Indexes created for performance
- ✅ Storage policies created (will activate when buckets exist)
- ✅ Automatic `updated_at` trigger configured

## What's Left

- ⏳ Create storage buckets (manual step above)

Once buckets are created, your app is fully ready to use!
