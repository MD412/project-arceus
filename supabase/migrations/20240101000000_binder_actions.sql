-- RENAME BINDER
CREATE OR REPLACE FUNCTION rename_binder(job_id_to_rename UUID, new_title TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.jobs
    SET binder_title = new_title
    WHERE id = job_id_to_rename AND auth.uid() = user_id;
END;
$$ LANGUAGE plpgsql;

-- DELETE BINDER
CREATE OR REPLACE FUNCTION delete_binder(job_id_to_delete UUID)
RETURNS VOID AS $$
DECLARE
    input_path TEXT;
    summary_path TEXT;
    paths_to_delete TEXT[];
BEGIN
    -- 1. Get the paths of the images from the jobs table
    SELECT
        input_image_path,
        results->>'summary_image_path'
    INTO
        input_path,
        summary_path
    FROM public.jobs
    WHERE id = job_id_to_delete AND auth.uid() = user_id;

    -- 2. Build an array of non-null paths to delete
    paths_to_delete := ARRAY[]::TEXT[];
    IF input_path IS NOT NULL THEN
        paths_to_delete := array_append(paths_to_delete, input_path);
    END IF;
    IF summary_path IS NOT NULL THEN
        paths_to_delete := array_append(paths_to_delete, summary_path);
    END IF;

    -- 3. Delete the files from storage if any exist
    IF array_length(paths_to_delete, 1) > 0 THEN
        PERFORM storage.delete_objects('binders', paths_to_delete);
    END IF;

    -- 4. Delete the job record itself
    DELETE FROM public.jobs
    WHERE id = job_id_to_delete AND auth.uid() = user_id;
END;
$$ LANGUAGE plpgsql; 