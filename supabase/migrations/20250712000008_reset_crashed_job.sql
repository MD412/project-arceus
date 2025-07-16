-- Reset the job that was picked up but worker crashed
UPDATE job_queue 
SET status = 'pending', 
    started_at = NULL, 
    visibility_timeout_at = NULL,
    picked_at = NULL
WHERE id = '25d885e2-d145-46f8-ade0-8dc0e68b48f7' AND status = 'processing';

-- Also reset the scan upload status  
UPDATE scan_uploads
SET processing_status = 'pending'
WHERE id = '327b3f1e-6680-4fab-8bc4-05038c7f1117'; 