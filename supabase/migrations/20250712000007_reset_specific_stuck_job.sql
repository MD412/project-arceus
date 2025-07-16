-- Reset the specific stuck job
UPDATE job_queue 
SET status = 'pending', 
    started_at = NULL, 
    visibility_timeout_at = NULL,
    picked_at = NULL
WHERE id = '25d885e2-d145-46f8-ade0-8dc0e68b48f7' AND status = 'processing'; 