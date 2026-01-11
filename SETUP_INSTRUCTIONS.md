# Supabase Database Setup - Step-by-Step Instructions

Follow these steps to set up your Supabase database for OOTD AI.

## Prerequisites
- Supabase project created
- Access to Supabase Dashboard
- Your project URL and anon key (Settings → API)

## Step 1: Run Database Migration ✅

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open the file `supabase-migration.sql` in this project
5. Copy the **entire contents** of the file
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. You should see "Success. No rows returned" or similar success message

**Verification**: Run this query to verify tables were created:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('items', 'outfits');
```
Expected result: Should return 2 rows (items and outfits)

## Step 2: Create Storage Buckets ✅

1. In Supabase Dashboard, navigate to **Storage** (left sidebar)
2. Click **New bucket**

### Bucket 1: `wardrobe-images`
- **Name**: `wardrobe-images` (exact match, lowercase)
- **Public bucket**: ❌ Unchecked (private)
- **File size limit**: `10485760` (10MB in bytes)
- **Allowed MIME types**: `image/jpeg,image/png,image/heic`
- Click **Create bucket**

### Bucket 2: `isolated-images`
- **Name**: `isolated-images` (exact match, lowercase)
- **Public bucket**: ❌ Unchecked (private)
- **File size limit**: `5242880` (5MB in bytes)
- **Allowed MIME types**: `image/png`
- Click **Create bucket**

**Verification**: Both buckets should appear in your Storage list

## Step 3: Run Storage Policies ✅

1. Go back to **SQL Editor**
2. Click **New Query**
3. Open the file `supabase-storage-policies.sql` in this project
4. Copy the **entire contents** of the file
5. Paste into the SQL Editor
6. Click **Run**

**Verification**: Run this query to verify policies were created:
```sql
SELECT policyname, bucket_id
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects';
```
Expected result: Should return 6 rows (3 policies per bucket)

## Step 4: Verify Complete Setup ✅

Run these verification queries in SQL Editor:

### Check Tables Exist
```sql
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('items', 'outfits');
```

### Check RLS is Enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('items', 'outfits');
```
Expected: `rowsecurity = true` for both tables

### Check Indexes Exist
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('items', 'outfits');
```
Expected: Should return 5 indexes

### Check Storage Policies
```sql
SELECT policyname, bucket_id
FROM pg_policies
WHERE schemaname = 'storage';
```
Expected: Should return 6 policies

## Step 5: Test Authentication

1. In your app, try signing up a new user
2. Check Supabase Dashboard → **Authentication** → **Users**
3. You should see your new user

## Step 6: Test Storage Upload

1. In your app, try uploading an item
2. Check Supabase Dashboard → **Storage** → `wardrobe-images`
3. You should see a folder with your user ID containing the uploaded image

## Troubleshooting

### Error: "relation already exists"
- The tables already exist. This is fine - the script uses `IF NOT EXISTS`
- You can safely re-run the migration script

### Error: "policy already exists"
- The policies already exist. The script uses `DROP POLICY IF EXISTS`
- You can safely re-run the storage policies script

### Storage upload fails with "permission denied"
- Verify storage buckets are created with exact names: `wardrobe-images` and `isolated-images`
- Check that storage policies script ran successfully
- Ensure you're authenticated in the app

### RLS errors when querying
- Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'items';`
- Check policies exist: `SELECT * FROM pg_policies WHERE tablename = 'items';`
- Ensure you're authenticated when making requests

## Next Steps

Once setup is complete:
1. ✅ Database tables created
2. ✅ Storage buckets created
3. ✅ Security policies configured
4. Test the app: Sign up → Upload item → View wardrobe → Generate OOTD

Your OOTD AI app is now ready to use!
