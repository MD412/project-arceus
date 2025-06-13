-- Create a new enumerated type for job statuses
CREATE TYPE public.job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create the jobs table
CREATE TABLE public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    status public.job_status DEFAULT 'pending'::public.job_status,
    input_image_path text,
    results jsonb,
    error_message text,
    binder_title text,
    CONSTRAINT jobs_pkey PRIMARY KEY (id),
    CONSTRAINT jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS) for the jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to create jobs for themselves
CREATE POLICY "Allow authenticated users to create their own jobs"
ON public.jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to view their own jobs
CREATE POLICY "Allow authenticated users to view their own jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow users to update their own jobs
CREATE POLICY "Allow authenticated users to update their own jobs"
ON public.jobs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to delete their own jobs
CREATE POLICY "Allow authenticated users to delete their own jobs"
ON public.jobs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
