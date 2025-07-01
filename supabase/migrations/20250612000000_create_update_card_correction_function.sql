-- Supabase SQL Migration: Create function to update a single card in a scan's results

create or replace function update_scan_card_correction(
    p_job_id uuid,
    p_card_index int,
    p_corrected_data jsonb
)
returns void
language plpgsql
security definer
as $$
declare
    v_current_results jsonb;
    v_updated_enriched_cards jsonb;
begin
    -- 1. Select the current 'results' JSON from the job_queue table.
    select results into v_current_results
    from public.job_queue
    where id = p_job_id;

    -- 2. Check if the results and the enriched_cards array exist.
    if v_current_results is null or not jsonb_path_exists(v_current_results, '$.enriched_cards') then
        raise exception 'Job or enriched_cards not found for job_id: %', p_job_id;
    end if;
    
    -- 3. Update the specific element in the 'enriched_cards' array.
    -- The path is zero-indexed, so we use p_card_index directly.
    -- We merge the existing card data with the new corrected data.
    v_updated_enriched_cards := jsonb_set(
        v_current_results -> 'enriched_cards',
        array[p_card_index]::text[],
        (v_current_results -> 'enriched_cards' -> p_card_index) || p_corrected_data
    );

    -- 4. Update the job_queue table with the modified 'results' JSON.
    update public.job_queue
    set results = jsonb_set(v_current_results, '{enriched_cards}', v_updated_enriched_cards)
    where id = p_job_id;

    -- Optional: Log the correction for future model training
    -- insert into public.card_corrections (job_id, card_index, corrected_data)
    -- values (p_job_id, p_card_index, p_corrected_data);

end;
$$;

grant execute on function update_scan_card_correction to authenticated; 