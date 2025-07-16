-- Temporarily disable RLS on worker_logs to debug insertion issues.
alter table public.worker_logs disable row level security; 