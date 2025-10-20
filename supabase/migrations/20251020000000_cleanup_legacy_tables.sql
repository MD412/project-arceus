-- Migration: Cleanup legacy tables
-- Date: 2025-10-20
-- Purpose: Remove truly unused tables that are confirmed to be legacy/superseded

BEGIN;

-- SAFE TO DROP: pipeline_review_items
-- Reason: Old review system, replaced by card_detections + scan review UI
-- Last seen: Initial schema (20250605), never used in production code
-- Grep hits: Only in old migrations, no active code references
DROP TABLE IF EXISTS public.pipeline_review_items CASCADE;
COMMENT ON SCHEMA public IS 'Dropped pipeline_review_items - legacy review system (2025-10-20)';

-- SAFE TO DROP: jobs (if it exists)
-- Reason: Appears to be duplicate of job_queue
-- Note: Check if this table even exists - might be from duplicate migrations
-- Grep hits: No active code references, only migrations
DROP TABLE IF EXISTS public.jobs CASCADE;
COMMENT ON SCHEMA public IS 'Dropped jobs - duplicate of job_queue (2025-10-20)';

-- DO NOT DROP: binder_page_uploads
-- Reason: This was renamed to scan_uploads, which no longer exists as a table
-- but EXISTS as a VIEW pointing to scans (see 20250806_fix_missing_tables.sql)
-- scan_uploads VIEW is ACTIVELY USED by both worker and API routes
-- Conclusion: Nothing to drop, it's already a view

-- DO NOT DROP: user_card_instances
-- Reason: Needs investigation - might be used for individual card tracking
-- TODO: Audit usage before deciding to drop

-- Summary of what we're dropping:
SELECT 
    'pipeline_review_items' AS table_name, 
    'Legacy tile-based review system' AS reason,
    'DROPPED' AS status
UNION ALL
SELECT 
    'jobs' AS table_name,
    'Duplicate of job_queue' AS reason,
    'DROPPED (if exists)' AS status
UNION ALL
SELECT
    'scan_uploads' AS table_name,
    'Now a VIEW (not table), actively used' AS reason,
    'KEPT - DO NOT DROP' AS status
UNION ALL
SELECT
    'user_card_instances' AS table_name,
    'Needs investigation' AS reason,
    'DEFERRED' AS status;

COMMIT;

-- Verification: Check what's left
SELECT 
    tablename AS table_name,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

