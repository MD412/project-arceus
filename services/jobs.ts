import { getSupabaseClient, getCurrentUser } from '@/lib/supabase/browser';

const supabase = getSupabaseClient();

/**
 * Fetches all jobs for the currently authenticated user.
 * RLS policies on the 'jobs' table ensure that users can only see their own jobs.
 */
export const getJobs = async () => {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
    throw new Error(`Error fetching jobs: ${JSON.stringify(error, null, 2)}`);
  }

  // Map scans table columns to match scan_uploads expected format
  return data?.map(scan => ({
    id: scan.id,
    user_id: scan.user_id,
    scan_title: scan.title,
    processing_status: scan.status,
    storage_path: scan.storage_path,
    results: {
      summary_image_path: scan.summary_image_path,
      total_cards_detected: 0 // Default value since we don't have this data
    },
    error_message: scan.error_message,
    created_at: scan.created_at,
    updated_at: scan.updated_at
  })) || [];
}

/**
 * Fetches a single job by its ID with card details.
 * Uses the API endpoint to get properly formatted data.
 * @param jobId - The UUID of the job to fetch.
 * @returns The job object with card details if found, otherwise null.
 */
export async function getJobById(jobId: string) {
  try {
    const response = await fetch(`/api/scans/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
      console.log(`Job with id ${jobId} not found.`);
      return null;
    }
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch job ${jobId}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(`Error fetching job ${jobId}:`, error);
    throw error;
  }
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
    body: JSON.stringify({ scan_title: newTitle }),
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

  console.log(`🗑️ Frontend: Deleting job ${jobId} with user ID: ${user.id}`);

  const response = await fetch('/api/commands/delete-scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
    },
    body: JSON.stringify({ scanId: jobId }),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to delete binder';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      errorMessage = `Server error (${response.status}): ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
} 