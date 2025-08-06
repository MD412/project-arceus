-- Fix for RAY-49, RAY-50, RAY-51: Restore missing tables after database reset
-- This migration recreates the job_queue table and creates scan_uploads as a view

-- 1. Create job_queue table (fixes RAY-49)
CREATE TABLE IF NOT EXISTS job_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    scan_upload_id uuid NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    job_type text DEFAULT 'process_scan_page' NOT NULL,
    payload jsonb DEFAULT '{}' NOT NULL,
    run_at timestamp with time zone DEFAULT now() NOT NULL,
    picked_at timestamp with time zone,
    completed_at timestamp with time zone,
    retry_count smallint DEFAULT 0 NOT NULL,
    error_message text,
    worker_id text,
    visibility_timeout timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT job_queue_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

-- Add foreign key to scans table (using scan_upload_id -> scans.id)
ALTER TABLE job_queue 
    ADD CONSTRAINT job_queue_scan_upload_id_fkey 
    FOREIGN KEY (scan_upload_id) 
    REFERENCES scans(id) 
    ON DELETE CASCADE;

-- Add index for efficient job dequeuing
CREATE INDEX IF NOT EXISTS idx_job_queue_status_run_at 
    ON job_queue(status, run_at) 
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_job_queue_scan_upload_id 
    ON job_queue(scan_upload_id);

-- 2. Create scan_uploads as a view of scans table (fixes RAY-51)
-- This allows the existing codebase to work without modifications
CREATE OR REPLACE VIEW scan_uploads AS
SELECT 
    id,
    user_id,
    title AS scan_title,
    status AS processing_status,
    progress,
    storage_path,
    summary_image_path,
    error_message,
    created_at,
    updated_at,
    -- Add computed columns that the codebase expects
    jsonb_build_object(
        'summary_image_path', summary_image_path,
        'total_cards_detected', 0
    ) AS results,
    storage_path AS content_hash -- Alias for compatibility
FROM scans;

-- Grant permissions on job_queue table
GRANT ALL ON job_queue TO authenticated;
GRANT ALL ON job_queue TO service_role;
GRANT SELECT ON job_queue TO anon;

-- 3. Create or replace the dequeue function for the worker
CREATE OR REPLACE FUNCTION dequeue_and_start_job()
RETURNS TABLE(
    job_id uuid,
    scan_upload_id uuid,
    job_type text,
    payload jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job_record RECORD;
BEGIN
    -- Select and lock the next available job
    SELECT * INTO v_job_record
    FROM job_queue
    WHERE status = 'pending'
      AND run_at <= now()
      AND (visibility_timeout IS NULL OR visibility_timeout < now())
    ORDER BY run_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- If no job found, return empty result
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Update the job status to processing
    UPDATE job_queue
    SET 
        status = 'processing',
        picked_at = now(),
        visibility_timeout = now() + interval '5 minutes',
        updated_at = now()
    WHERE id = v_job_record.id;

    -- Return the job details
    RETURN QUERY
    SELECT 
        v_job_record.id,
        v_job_record.scan_upload_id,
        v_job_record.job_type,
        v_job_record.payload;
END;
$$;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION dequeue_and_start_job TO service_role;

-- 4. Create function to finalize job (mark as complete/failed)
CREATE OR REPLACE FUNCTION finalize_job(
    p_job_id uuid,
    p_status text,
    p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE job_queue
    SET 
        status = p_status,
        completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN now() ELSE NULL END,
        error_message = p_error_message,
        visibility_timeout = NULL,
        updated_at = now()
    WHERE id = p_job_id;
END;
$$;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION finalize_job TO service_role;

-- 5. Create function to enqueue a scan job
CREATE OR REPLACE FUNCTION enqueue_scan_job(
    p_scan_id uuid,
    p_storage_path text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job_id uuid;
BEGIN
    INSERT INTO job_queue (
        scan_upload_id,
        status,
        job_type,
        payload
    )
    VALUES (
        p_scan_id,
        'pending',
        'process_scan_page',
        jsonb_build_object('storage_path', p_storage_path)
    )
    RETURNING id INTO v_job_id;
    
    RETURN v_job_id;
END;
$$;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION enqueue_scan_job TO authenticated;
GRANT EXECUTE ON FUNCTION enqueue_scan_job TO service_role;

-- Add RLS policies for job_queue
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their own jobs
CREATE POLICY "Users can view their own jobs" ON job_queue
    FOR SELECT
    USING (
        scan_upload_id IN (
            SELECT id FROM scans WHERE user_id = auth.uid()
        )
    );

-- Policy for service role to manage all jobs
CREATE POLICY "Service role can manage all jobs" ON job_queue
    FOR ALL
    USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE job_queue IS 'Background job processing queue for scan uploads';
COMMENT ON VIEW scan_uploads IS 'Compatibility view for scans table (legacy scan_uploads references)';