-- Migration: pending_review_scans should include ONLY scans in 'ready' status
begin;

drop view if exists pending_review_scans;

create view pending_review_scans as
select
    su.id,
    coalesce(su.scan_title, su.id::text)             as title,
    coalesce(su.upload_timestamp, su.created_at)     as created_at,
    (
        select count(*) from card_detections cd 
        join scans s on cd.scan_id = s.id 
        where s.storage_path = su.storage_path
    )                                                as total_detections
from scan_uploads su
where su.deleted_at is null
  and su.processing_status = 'review_pending';

commit;