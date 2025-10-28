-- Hotfix: Fix enqueue_scan_job status constraint violation
-- The function was using 'queued' status which isn't in the allowed values
-- Allowed statuses: 'processing', 'ready', 'completed', 'error'

DROP FUNCTION IF EXISTS public.enqueue_scan_job(uuid, uuid, text);

CREATE FUNCTION public.enqueue_scan_job(
    p_scan_id uuid,
    p_user_id uuid,
    p_storage_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if scan already exists for this storage path
    IF EXISTS (SELECT 1 FROM scans WHERE storage_path = p_storage_path) THEN
        RAISE NOTICE 'Scan already exists for storage_path: %', p_storage_path;
        RETURN;
    END IF;

    -- Insert the scan record with 'processing' status (valid constraint value)
    INSERT INTO public.scans(id, user_id, storage_path, title, status)
    VALUES (p_scan_id, p_user_id, p_storage_path, 'Untitled Scan', 'processing');

    -- Insert the corresponding job
    INSERT INTO public.job_queue(scan_upload_id, status, job_type, payload)
    VALUES (p_scan_id, 'pending', 'process_scan_page', jsonb_build_object('storage_path', p_storage_path));
END;
$$;

COMMENT ON FUNCTION public.enqueue_scan_job IS 'Idempotent: Prevents duplicate scans. Uses processing status to match scan constraint.';

