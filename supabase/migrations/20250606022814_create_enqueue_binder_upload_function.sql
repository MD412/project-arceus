create or replace function public.enqueue_binder_upload(
    p_user_id uuid,
    p_storage_path text,
    p_content_hash text
)
returns table (job_id bigint)
language plpgsql
as $$
declare
    v_upload_id uuid;
    v_job_id bigint;
begin
    -- Insert the new upload record and get its ID
    insert into public.binder_page_uploads (user_id, storage_path, content_hash, processing_status)
    values (p_user_id, p_storage_path, p_content_hash, 'pending')
    returning id into v_upload_id;

    -- Insert a job into the queue for the new upload, including storage_path in the payload
    insert into public.job_queue (binder_page_upload_id, job_type, status, payload)
    values (v_upload_id, 'process_binder_page', 'pending', jsonb_build_object(
        'upload_id', v_upload_id,
        'storage_path', p_storage_path
    ))
    returning id into v_job_id;

    -- Return the ID of the created job
    return query select v_job_id;
end;
$$;
