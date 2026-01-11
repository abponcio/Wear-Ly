-- OOTD AI - Database Setup Verification Script
-- Run this in Supabase SQL Editor to verify everything is set up correctly

-- 1. Check Tables Exist
SELECT
  'Tables Check' as check_type,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('items', 'outfits')
ORDER BY table_name;

-- 2. Check RLS is Enabled
SELECT
  'RLS Check' as check_type,
  tablename as table_name,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('items', 'outfits')
ORDER BY tablename;

-- 3. Check Indexes Exist
SELECT
  'Indexes Check' as check_type,
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('items', 'outfits')
ORDER BY tablename, indexname;

-- 4. Check RLS Policies for Tables
SELECT
  'Table Policies' as check_type,
  policyname,
  tablename,
  cmd as command_type
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('items', 'outfits')
ORDER BY tablename, policyname;

-- 5. Check Storage Policies
SELECT
  'Storage Policies' as check_type,
  policyname,
  bucket_id,
  cmd as command_type
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY bucket_id, policyname;

-- 6. Check Trigger Exists
SELECT
  'Triggers Check' as check_type,
  trigger_name,
  event_object_table as table_name,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'items';

-- Summary: Expected Results
-- Tables: 2 tables (items, outfits)
-- RLS: Both tables should have rowsecurity = true
-- Indexes: 5 indexes total
-- Table Policies: 4 policies for items, 2 policies for outfits
-- Storage Policies: 6 policies (3 per bucket)
-- Triggers: 1 trigger (update_items_updated_at)
