create or replace function public.dequeue_and_start_job()
returns table (
    id bigint,
    binder_page_upload_id uuid,
    job_type text,
    payload jsonb
)
language plpgsql
as $$
declare
    v_job_id bigint;
begin
    -- Find the oldest pending job and lock it
    select q.id into v_job_id
    from public.job_queue q
    where q.status = 'pending'
    order by q.created_at asc
    limit 1
    for update skip locked;

    if v_job_id is null then
        return;
    end if;

    -- Update the job's status to 'running' and return its details
    return query
    update public.job_queue
    set status = 'running', updated_at = now()
    where public.job_queue.id = v_job_id
    returning public.job_queue.id, public.job_queue.binder_page_upload_id, public.job_queue.job_type, public.job_queue.payload;
end;
$$;
