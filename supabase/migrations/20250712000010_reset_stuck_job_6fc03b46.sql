-- Reset the job that's stuck in processing status
UPDATE job_queue 
SET status = 'pending', 
    started_at = NULL, 
    visibility_timeout_at = NULL,
    picked_at = NULL
WHERE id = '6fc03b46-9fd5-48d3-801f-6ae383e19a4f' AND status = 'processing';

-- Also reset the corresponding scan upload
UPDATE scan_uploads
SET processing_status = 'pending'
WHERE id = '7ff54df4-bc3d-46c2-9deb-af1a51b2958f'; 