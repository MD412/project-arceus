import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobs, getJobById, renameJob, deleteJob } from '@/services/jobs';

/**
 * A custom hook to fetch all jobs for the current user.
 * It uses TanStack Query to handle caching, refetching, and server state.
 */
export function useJobs() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['binder_page_uploads'], // A unique key for this query
    queryFn: getJobs,   // The function that will be called to fetch the data
  });

  const renameJobMutation = useMutation({
    mutationFn: ({ jobId, newTitle }: { jobId: string; newTitle: string }) => renameJob(jobId, newTitle),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['binder_page_uploads'] });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (jobId: string) => deleteJob(jobId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['binder_page_uploads'] });
    },
  });

  return {
    data,
    isLoading,
    isError,
    error,
    renameJob: renameJobMutation.mutate,
    deleteJob: deleteJobMutation.mutate,
  };
}

/**
 * A custom hook to fetch a single job by its ID.
 * @param jobId The ID of the job to fetch.
 */
export function useJob(jobId: string | undefined) {
  return useQuery({
    // The query key is an array that includes the entity name and the ID.
    // This ensures that queries for different jobs are cached separately.
    queryKey: ['job', jobId],
    // The query function will only be called if the jobId is not undefined.
    queryFn: () => getJobById(jobId!),
    // The `enabled` option prevents the query from running if jobId is not available.
    enabled: !!jobId,
  });
} 