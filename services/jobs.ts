import { getSupabaseClient, getCurrentUser } from '@/lib/supabase/browser';

const supabase = getSupabaseClient();

/**
 * Fetches all jobs for the currently authenticated user.
 * RLS policies on the 'jobs' table ensure that users can only see their own jobs.
 */
export const getJobs = async () => {
  const { data, error } = await supabase
    .from('scan_uploads')
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
    .from('scan_uploads')
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

/**
 * Renames a binder by calling the server-side API endpoint.
 * @param jobId - The UUID of the job to rename.
 * @param newTitle - The new title for the binder.
 */
export async function renameJob(jobId: string, newTitle: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`/api/scans/${jobId}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': user.id
    },
    body: JSON.stringify({ binder_title: newTitle }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to rename binder');
  }
}

/**
 * Deletes a binder by calling the server-side API endpoint.
 * @param jobId - The UUID of the job to delete.
 */
export async function deleteJob(jobId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`/api/scans/${jobId}`, {
    method: 'DELETE',
    headers: {
      'x-user-id': user.id
    },
  });

  if (!response.ok) {
    let errorMessage = 'Failed to delete binder';
    try {
    const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // Response might not be JSON (500 error, etc.)
      errorMessage = `Server error (${response.status}): ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
} 