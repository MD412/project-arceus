-- Migration: Fix pending_review_scans view to correctly count detections
-- The view should use the same logic as fetchDetections: get scan_id from scan_uploads.results

begin;

drop view if exists pending_review_scans;

create view pending_review_scans as
select
    su.id,
    coalesce(su.scan_title, su.id::text)             as title,
    coalesce(su.upload_timestamp, su.created_at)     as created_at,
    (
        select count(*) from card_detections cd 
        where cd.scan_id = (su.results->>'scan_id')::uuid
    )                                                as total_detections
from scan_uploads su
where su.deleted_at is null
  and su.processing_status = 'review_pending';

commit; 