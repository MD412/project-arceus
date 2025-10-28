-- Fix duplicate scan uploads
-- Add unique constraint on storage_path to prevent duplicate processing

-- First, clean up existing duplicates (keep older scan, delete newer)
WITH duplicates AS (
  SELECT 
    id,
    storage_path,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY storage_path ORDER BY created_at) as rn
  FROM scans
  WHERE storage_path IS NOT NULL
)
DELETE FROM scans
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX idx_scans_storage_path_unique 
ON scans(storage_path) 
WHERE storage_path IS NOT NULL;

-- Update enqueue_scan_job to be idempotent
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

    -- Insert the scan record
    INSERT INTO public.scans(id, user_id, storage_path, title, status)
    VALUES (p_scan_id, p_user_id, p_storage_path, 'Untitled Scan', 'queued');

    -- Insert the corresponding job
    INSERT INTO public.job_queue(scan_upload_id, status, job_type, payload)
    VALUES (p_scan_id, 'pending', 'process_scan_page', jsonb_build_object('storage_path', p_storage_path));
END;
$$;

COMMENT ON FUNCTION public.enqueue_scan_job IS 'Idempotent: Prevents duplicate scans for the same storage_path';

