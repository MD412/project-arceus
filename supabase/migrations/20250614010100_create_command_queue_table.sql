-- Migration: create command_queue table
-- Description: Stores asynchronous commands for Optimistic CRUD Pipeline.

BEGIN;

CREATE TABLE IF NOT EXISTS public.command_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ
);

-- Index to quickly fetch unprocessed commands
CREATE INDEX IF NOT EXISTS idx_command_queue_unprocessed ON public.command_queue (processed_at) WHERE processed_at IS NULL;

COMMIT; 