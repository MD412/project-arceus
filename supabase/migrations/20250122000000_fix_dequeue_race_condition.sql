-- Fix critical race condition in job dequeue function
-- The previous version had a gap between SELECT and UPDATE that allowed double processing

DROP FUNCTION IF EXISTS public.dequeue_and_start_job();

CREATE OR REPLACE FUNCTION public.dequeue_and_start_job()
RETURNS TABLE (
    id uuid,
    scan_upload_id uuid,
    job_type text,
    payload jsonb,
    retry_count integer
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- ATOMIC OPERATION: Select, update, and lock in a single statement
    -- This eliminates the race condition completely
    RETURN QUERY
    UPDATE public.job_queue
    SET 
        status = 'processing',
        started_at = now(),
        updated_at = now(),
        visibility_timeout_at = now() + INTERVAL '10 minutes',  -- Set timeout atomically
        picked_at = now()  -- Track when job was picked up
    WHERE id = (
        SELECT q.id
        FROM public.job_queue q
        WHERE q.status = 'pending'
        ORDER BY q.created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED  -- Critical: Skip locked rows to prevent blocking
    )
    RETURNING 
        public.job_queue.id, 
        public.job_queue.scan_upload_id, 
        public.job_queue.job_type, 
        public.job_queue.payload,
        COALESCE(public.job_queue.retry_count, 0) as retry_count;
END;
$$;

-- Add helpful comment for future developers
COMMENT ON FUNCTION public.dequeue_and_start_job() IS 
'Atomically dequeue and start processing a job. This function eliminates race conditions by combining SELECT and UPDATE into a single atomic operation. The visibility_timeout_at is set immediately to prevent double processing.';

-- Also add the picked_at column if it doesn't exist (for better debugging)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'job_queue' AND column_name = 'picked_at') THEN
        ALTER TABLE public.job_queue ADD COLUMN picked_at timestamptz;
        COMMENT ON COLUMN public.job_queue.picked_at IS 'Timestamp when job was picked up by a worker (for debugging)';
    END IF;
END $$;