BEGIN;

SET search_path = public; -- Suggested: Ensure public schema is primary

-- Stage 1: DDL / Migrations

-- 1. Create ENUM types
CREATE TYPE public.processing_status_enum AS ENUM (
    'queued',
    'processing',
    'review_pending',
    'failed',
    'timeout',
    'cancelled'
);

CREATE TYPE public.job_status_enum AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'timeout'
);

-- 2. Alter binder_page_uploads table

-- Add content_hash column (using char(64) for SHA-256 hex string)
ALTER TABLE public.binder_page_uploads
ADD COLUMN content_hash char(64);

-- Comment: If binder_page_uploads already has data, the following multi-step process is safer
-- for migrating processing_status and ensuring content_hash is populated.

-- Step A: Safer migration for processing_status if data exists
ALTER TABLE public.binder_page_uploads
ADD COLUMN _processing_status public.processing_status_enum;

-- Comment: The following UPDATE will only succeed if old text values in 'processing_status'
-- are valid members of the 'public.processing_status_enum'.
-- Manual data cleanup might be needed for non-matching legacy values.
UPDATE public.binder_page_uploads
SET _processing_status = processing_status::public.processing_status_enum;

ALTER TABLE public.binder_page_uploads
DROP COLUMN IF EXISTS processing_status; -- Drop the old text column

ALTER TABLE public.binder_page_uploads
RENAME COLUMN _processing_status TO processing_status;

-- Set NOT NULL and DEFAULT for the new enum-based processing_status column
ALTER TABLE public.binder_page_uploads
ALTER COLUMN processing_status SET NOT NULL;
ALTER TABLE public.binder_page_uploads
ALTER COLUMN processing_status SET DEFAULT 'queued';

-- Populate and set NOT NULL for content_hash
-- Comment: For existing rows, content_hash needs to be populated before setting to NOT NULL.
-- Example: UPDATE public.binder_page_uploads SET content_hash = encode(sha256(storage_path::bytea), 'hex') WHERE content_hash IS NULL;
-- This assumes you want to hash, for example, the storage_path. Actual hashing logic for existing files would be external.
-- For now, if you have existing rows, you might need to manually populate or use a temporary filler like gen_random_uuid()::char(64).
ALTER TABLE public.binder_page_uploads
ALTER COLUMN content_hash SET NOT NULL;

-- 4. Add unique index to binder_page_uploads (allowing retries for 'failed' status)
CREATE UNIQUE INDEX idx_binder_page_uploads_user_hash_unique
ON public.binder_page_uploads (user_id, content_hash)
WHERE processing_status <> 'failed';

-- 3. Create job_queue table
CREATE TABLE public.job_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    binder_page_upload_id uuid NOT NULL REFERENCES public.binder_page_uploads(id) ON DELETE CASCADE,
    status public.job_status_enum NOT NULL DEFAULT 'pending', -- Already using ENUM and correct default
    run_at timestamptz NOT NULL DEFAULT now(),
    picked_at timestamptz,
    retry_count smallint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Disable RLS for job_queue as it's primarily accessed by service_role worker
ALTER TABLE public.job_queue DISABLE ROW LEVEL SECURITY;

-- Trigger for job_queue updated_at
-- Comment: Ensure public.handle_updated_at() function exists and is SECURITY DEFINER.
CREATE TRIGGER on_job_queue_updated
BEFORE UPDATE ON public.job_queue
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for job_queue (idx_job_queue_status_run_at for worker picker efficiency)
CREATE INDEX idx_job_queue_status_run_at ON public.job_queue (status, run_at);
CREATE INDEX idx_job_queue_binder_page_upload_id ON public.job_queue (binder_page_upload_id);

-- 5. Stub record_pipeline_results() PG function (Updated signature and added SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.record_pipeline_results(
    _page_id uuid,
    _items jsonb,
    _status public.processing_status_enum DEFAULT 'review_pending',
    _error TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Suggested for future-proofing if called by worker with scoped JWT
AS $$
BEGIN
    RETURN;
END;
$$;

-- Grant usage on ENUM types and EXECUTE on the function to authenticated role
GRANT USAGE ON TYPE public.processing_status_enum TO authenticated;
GRANT USAGE ON TYPE public.job_status_enum TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_pipeline_results(uuid, jsonb, public.processing_status_enum, TEXT) TO authenticated;

COMMIT; 