import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/browser';

export interface InboxItem {
  id: string;
  title: string | null;
  created_at: string;
  total_detections: number;
}

async function fetchInbox(): Promise<InboxItem[]> {
  const supabase = getSupabaseClient();
  
  // Add a timeout to the query
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Request timed out')), 3000)
  );
  
  const queryPromise = supabase
    .from('pending_review_scans')
    .select('*')
    .order('created_at', { ascending: false });

  const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
  
  if (error) throw error;
  return (data || []) as InboxItem[];
}

export function useReviewInbox() {
  return useQuery({
    queryKey: ['review-inbox'],
    queryFn: fetchInbox,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchInterval: false, // Disable automatic refetching
    retry: 1, // Only retry once
    timeout: 3000, // 3 second timeout
  });
}
