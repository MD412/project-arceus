-- Add worker_health table for monitoring worker liveness
create table if not exists public.worker_health (
    id text primary key,
    last_heartbeat timestamp with time zone not null
);

-- Add visibility_timeout_at column to job_queue for auto-requeue logic
alter table public.job_queue
    add column if not exists visibility_timeout_at timestamp with time zone;

-- Index to speed up lookup of stale processing jobs
create index if not exists job_queue_visibility_timeout_idx
    on public.job_queue (visibility_timeout_at)
    where status = 'processing'; 