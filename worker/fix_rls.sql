-- Fix RLS for Project Arceus Worker
-- Run this in Supabase SQL Editor

-- Option 1: Disable RLS entirely for tables the worker needs
-- (Simplest approach for testing)

ALTER TABLE binder_page_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_review_items DISABLE ROW LEVEL SECURITY;

-- Keep RLS on cards table but allow service role access
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything on cards table
CREATE POLICY "Service role full access" ON cards
FOR ALL
USING (true);

-- Verify tables exist and show their structure
SELECT table_name, row_security 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cards', 'binder_page_uploads', 'pipeline_review_items');

-- Show existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public'; 