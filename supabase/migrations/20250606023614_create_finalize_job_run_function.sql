create or replace function public.finalize_job_run(
    p_job_id bigint,
    p_upload_id uuid,
    p_final_status public.processing_status_enum,
    p_review_items jsonb default '[]'::jsonb,
    p_error_message text default null
)
returns void
language plpgsql
as $$
begin
    -- Update the master upload record's status
    update public.binder_page_uploads
    set
        processing_status = p_final_status,
        updated_at = now()
    where id = p_upload_id;

    -- If there are review items, insert them
    if jsonb_array_length(p_review_items) > 0 then
        insert into public.pipeline_review_items (binder_page_upload_id, details)
        select
            p_upload_id,
            value
        from jsonb_array_elements(p_review_items);
    end if;

    -- Update the job queue record itself to 'completed' or 'failed'
    update public.job_queue
    set
        status = case
            when p_final_status = 'failed' then 'failed'::public.job_status_enum
            else 'completed'::public.job_status_enum
        end,
        payload = payload || jsonb_build_object('error', p_error_message), -- Append error info if any
        updated_at = now()
    where id = p_job_id;
end;
$$;
