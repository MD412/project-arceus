create or replace function public.enqueue_scan_job(
    p_scan_id uuid,
    p_user_id uuid,
    p_storage_path text
)
returns void
language plpgsql
security definer -- To bypass RLS for the transaction
as $$
begin
    -- Step 1: Insert the scan upload record.
    insert into public.scan_uploads(id, user_id, storage_path, scan_title, processing_status)
    values (p_scan_id, p_user_id, p_storage_path, right(p_storage_path, 41), 'queued');

    -- Step 2: Insert the corresponding job.
    insert into public.job_queue(scan_upload_id, status, job_type, payload)
    values (p_scan_id, 'pending', 'process_scan_page', jsonb_build_object('storage_path', p_storage_path));
end;
$$; 