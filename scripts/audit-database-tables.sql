-- Database Table Audit Query
-- Purpose: Show all tables and views in the public schema with row counts
-- Run this against your Supabase database to see what actually exists

-- List all tables with estimated row counts
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = tablename) AS column_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- List all views
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check for specific legacy tables we think are unused
SELECT 
    'pipeline_review_items' AS table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'pipeline_review_items' AND table_schema = 'public') AS exists;

SELECT 
    'binder_page_uploads' AS table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'binder_page_uploads' AND table_schema = 'public') AS exists;

SELECT 
    'jobs' AS table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs' AND table_schema = 'public') AS exists;

SELECT 
    'user_card_instances' AS table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'user_card_instances' AND table_schema = 'public') AS exists;

