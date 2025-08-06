-- Migration: Fix pending_review_scans view to use total_detections from results
-- The worker already calculates the correct count, so use that instead of recounting

begin;

drop view if exists pending_review_scans;

create view pending_review_scans as
select
    su.id,
    coalesce(su.scan_title, su.id::text)             as title,
    coalesce(su.upload_timestamp, su.created_at)     as created_at,
    coalesce((su.results->>'total_detections')::int, 0) as total_detections
from scan_uploads su
where su.deleted_at is null
  and su.processing_status = 'review_pending';

commit; 