-- Migration: Enable RLS and create insert policy for command_queue
-- Description: Allows authenticated users to insert commands into the queue.

BEGIN;

-- 1. Enable Row Level Security
ALTER TABLE public.command_queue ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for inserting commands
-- This allows any authenticated user to add a job to the queue.
-- The Edge Function that processes the queue is secure and will validate ownership.
CREATE POLICY "authenticated_users_can_insert_commands"
ON public.command_queue
FOR INSERT
TO authenticated
WITH CHECK (true);

COMMIT; 