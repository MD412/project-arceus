-- Auto-Recovery System Migration
-- Adds retry tracking and stuck job detection

-- 1. Add retry_count column to job_queue if it doesn't exist
ALTER TABLE job_queue 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- 2. Add error_message column to job_queue if it doesn't exist  
ALTER TABLE job_queue
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 3. Create index for faster stuck job queries
CREATE INDEX IF NOT EXISTS idx_job_queue_stuck_detection 
ON job_queue (status, started_at, visibility_timeout_at) 
WHERE status = 'processing';

-- 4. Create function to find stuck jobs
CREATE OR REPLACE FUNCTION get_stuck_jobs(
    stuck_minutes INTEGER DEFAULT 10,
    timeout_grace_minutes INTEGER DEFAULT 2
)
RETURNS TABLE (
    id UUID,
    status TEXT,
    scan_upload_id UUID,
    created_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    visibility_timeout_at TIMESTAMPTZ,
    retry_count INTEGER,
    minutes_stuck NUMERIC,
    minutes_past_timeout NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jq.id,
        jq.status,
        jq.scan_upload_id,
        jq.created_at,
        jq.started_at,
        jq.visibility_timeout_at,
        COALESCE(jq.retry_count, 0) as retry_count,
        EXTRACT(EPOCH FROM (NOW() - jq.started_at))/60 as minutes_stuck,
        CASE 
            WHEN jq.visibility_timeout_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (NOW() - jq.visibility_timeout_at))/60
            ELSE 0
        END as minutes_past_timeout
    FROM job_queue jq
    WHERE jq.status = 'processing'
      AND (
        jq.visibility_timeout_at < NOW() - INTERVAL '1 minute' * timeout_grace_minutes
        OR jq.started_at < NOW() - INTERVAL '1 minute' * stuck_minutes
      )
    ORDER BY jq.started_at;
END;
$$;

-- 5. Create function for automatic job recovery
CREATE OR REPLACE FUNCTION auto_recover_stuck_jobs(
    max_retries INTEGER DEFAULT 3,
    stuck_minutes INTEGER DEFAULT 10
)
RETURNS TABLE (
    jobs_recovered INTEGER,
    jobs_failed INTEGER,
    recovery_details JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    stuck_job RECORD;
    recovered_count INTEGER := 0;
    failed_count INTEGER := 0;
    recovery_log JSONB := '[]'::jsonb;
BEGIN
    -- Find and process stuck jobs
    FOR stuck_job IN 
        SELECT * FROM get_stuck_jobs(stuck_minutes, 2)
    LOOP
        IF stuck_job.retry_count >= max_retries THEN
            -- Mark as permanently failed
            UPDATE job_queue 
            SET 
                status = 'failed',
                finished_at = NOW(),
                error_message = 'Exceeded automatic retry limit (' || max_retries || ')'
            WHERE id = stuck_job.id;
            
            -- Update scan status
            UPDATE scan_uploads
            SET 
                processing_status = 'failed',
                error_message = 'Processing failed after ' || max_retries || ' retries',
                updated_at = NOW()
            WHERE id = stuck_job.scan_upload_id;
            
            failed_count := failed_count + 1;
            recovery_log := recovery_log || jsonb_build_object(
                'job_id', stuck_job.id,
                'action', 'marked_failed',
                'retry_count', stuck_job.retry_count,
                'minutes_stuck', stuck_job.minutes_stuck
            );
        ELSE
            -- Recover by resetting to pending
            UPDATE job_queue
            SET 
                status = 'pending',
                started_at = NULL,
                visibility_timeout_at = NULL,
                retry_count = stuck_job.retry_count + 1,
                updated_at = NOW()
            WHERE id = stuck_job.id;
            
            -- Reset scan status
            UPDATE scan_uploads
            SET 
                processing_status = 'queued',
                error_message = NULL,
                updated_at = NOW()
            WHERE id = stuck_job.scan_upload_id;
            
            recovered_count := recovered_count + 1;
            recovery_log := recovery_log || jsonb_build_object(
                'job_id', stuck_job.id,
                'action', 'auto_recovered',
                'retry_count', stuck_job.retry_count + 1,
                'minutes_stuck', stuck_job.minutes_stuck
            );
        END IF;
    END LOOP;
    
    -- Return results
    RETURN QUERY SELECT recovered_count, failed_count, recovery_log;
END;
$$;

-- 6. Create trigger to update worker_health last_ping column name for consistency
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worker_health' AND column_name = 'last_ping'
    ) THEN
        ALTER TABLE worker_health ADD COLUMN last_ping TIMESTAMPTZ;
        UPDATE worker_health SET last_ping = last_heartbeat WHERE last_ping IS NULL;
    END IF;
END
$$;

-- 7. Create view for job queue health monitoring
CREATE OR REPLACE VIEW job_queue_health AS
SELECT 
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/60)::NUMERIC(10,2) as avg_age_minutes,
    MAX(EXTRACT(EPOCH FROM (NOW() - created_at))/60)::NUMERIC(10,2) as max_age_minutes,
    COUNT(*) FILTER (WHERE retry_count > 0) as retried_jobs,
    COUNT(*) FILTER (WHERE retry_count >= 3) as high_retry_jobs
FROM job_queue
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY 
    CASE status 
        WHEN 'processing' THEN 1
        WHEN 'pending' THEN 2
        WHEN 'failed' THEN 3
        WHEN 'completed' THEN 4
        ELSE 5
    END;

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_stuck_jobs TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auto_recover_stuck_jobs TO authenticated, service_role;
GRANT SELECT ON job_queue_health TO authenticated, service_role; 