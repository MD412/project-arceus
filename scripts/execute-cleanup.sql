-- Quick verification and cleanup script
-- Run this in Supabase Studio SQL Editor

-- Step 1: Check if legacy tables exist
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = t.table_name
        ) THEN '✗ EXISTS - will drop'
        ELSE '✓ Already gone'
    END AS status
FROM (VALUES 
    ('pipeline_review_items'),
    ('jobs')
) AS t(table_name);

-- Step 2: Check row counts if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pipeline_review_items') THEN
        RAISE NOTICE 'pipeline_review_items has % rows', (SELECT count(*) FROM pipeline_review_items);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        RAISE NOTICE 'jobs has % rows', (SELECT count(*) FROM jobs);
    END IF;
END $$;

-- Step 3: Drop the tables (safe - will only drop if they exist)
DROP TABLE IF EXISTS public.pipeline_review_items CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;

-- Step 4: Verify cleanup succeeded
SELECT 
    '✅ Cleanup complete! Remaining tables:' AS message;

SELECT 
    tablename AS table_name,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

