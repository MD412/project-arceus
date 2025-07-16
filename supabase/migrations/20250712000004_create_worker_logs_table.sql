create table public.worker_logs (
  id bigserial primary key,
  created_at timestamptz default now(),
  message text,
  payload jsonb
);

alter table public.worker_logs enable row level security;

create policy "service role can manage worker logs"
  on public.worker_logs for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );

grant all on table public.worker_logs to service_role;
grant all on sequence public.worker_logs_id_seq to service_role; 