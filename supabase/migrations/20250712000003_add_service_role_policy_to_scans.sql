-- Add a specific policy for the service_role to manage scans, bypassing RLS
create policy "service can manage scans"
  on scans for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' ); 