-- Migration: add deleted_at and version columns to scan_uploads
-- Description: Enables soft-delete and optimistic locking for the Optimistic CRUD Pipeline.

BEGIN;

ALTER TABLE public.scan_uploads
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;

-- Optional: index for quick filtering of active rows
CREATE INDEX IF NOT EXISTS idx_scan_uploads_deleted_at ON public.scan_uploads (deleted_at);

COMMIT; 