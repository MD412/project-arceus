-- Fix ambiguous column reference in dequeue_and_start_job function
DROP FUNCTION IF EXISTS public.dequeue_and_start_job();

CREATE OR REPLACE FUNCTION public.dequeue_and_start_job()
RETURNS table (
    id uuid,
    scan_upload_id uuid,
    job_type text,
    payload jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_job_id uuid;
BEGIN
    -- Find the oldest pending job and lock it
    SELECT q.id INTO v_job_id
    FROM public.job_queue q
    WHERE q.status = 'pending'
    ORDER BY q.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_job_id IS NULL THEN
        RETURN;
    END IF;

    -- Update the job's status to 'processing' and set start time
    RETURN QUERY
    UPDATE public.job_queue jq
    SET 
        status = 'processing', 
        started_at = now(),
        updated_at = now()
    WHERE jq.id = v_job_id
    RETURNING jq.id, jq.scan_upload_id, jq.job_type, jq.payload;
END;
$$; 