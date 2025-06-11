import { supabase } from '@/lib/supabase/browser';

interface JobPayload {
  binder_title: string;
  input_image_path: string;
}

/**
 * Creates a new job entry in the public.jobs table.
 * This is called after a file has been successfully uploaded to storage.
 * @param payload - The data needed to create the job.
 * @returns The newly created job record.
 */
export async function createJob(payload: JobPayload) {
  // Supabase auth helper automatically gets the user, RLS on the table
  // ensures that the user_id must match the authenticated user.
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      binder_title: payload.binder_title,
      input_image_path: payload.input_image_path,
    })
    .select() // Return the created row
    .single(); // Expect only one row back

  if (error) {
    console.error('Error creating job:', error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Fetches all jobs for the currently authenticated user.
 * RLS policies on the 'jobs' table ensure that users can only see their own jobs.
 */
export async function getJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Fetches a single job by its ID.
 * RLS policies ensure the user can only access a job they own.
 * @param jobId - The UUID of the job to fetch.
 * @returns The job object if found, otherwise null.
 */
export async function getJobById(jobId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single(); // Expect one or zero rows

  if (error) {
    if (error.code === 'PGRST116') {
      // PGRST116: "The result contains 0 rows" - this is not a server error.
      console.log(`Job with id ${jobId} not found.`);
      return null;
    }
    console.error(`Error fetching job ${jobId}:`, error);
    throw new Error(error.message);
  }

  return data;
} 