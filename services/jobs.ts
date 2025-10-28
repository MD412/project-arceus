import { getSupabaseClient, getCurrentUser } from '@/lib/supabase/browser';

const supabase = getSupabaseClient();

/**
 * Fetches all jobs for the currently authenticated user.
 * RLS policies on the 'jobs' table ensure that users can only see their own jobs.
 */
export const getJobs = async () => {
  // Use scan_uploads view which already computes detection counts
  const { data, error } = await supabase
    .from('scan_uploads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
    throw new Error(`Error fetching jobs: ${JSON.stringify(error, null, 2)}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Generate scan titles: show UUID if untitled
  const generateScanTitle = (scan: any) => {
    if (scan.scan_title && scan.scan_title.trim() !== '' && scan.scan_title !== 'Untitled Scan') {
      return scan.scan_title;
    }
    // Show UUID for untitled scans
    return scan.id;
  };

  // Map to expected format with corrected titles
  return data.map((scan) => ({
    ...scan,
    scan_title: generateScanTitle(scan)
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