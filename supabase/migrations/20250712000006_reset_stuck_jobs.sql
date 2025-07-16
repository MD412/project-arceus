-- Reset any stuck jobs back to pending
UPDATE job_queue 
SET status = 'pending', 
    started_at = NULL, 
    visibility_timeout_at = NULL,
    picked_at = NULL
WHERE status = 'processing';

-- Also reset the scan_uploads status
UPDATE scan_uploads
SET processing_status = 'pending'
WHERE processing_status = 'processing'; 