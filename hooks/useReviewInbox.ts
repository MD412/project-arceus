import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/browser';

export interface InboxItem {
  id: string;
  title: string | null;
  created_at: string;
  total_detections: number;
}

async function fetchInbox(): Promise<InboxItem[]> {
  // Server API performs admin-side joins and per-user filtering safely
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch('/api/scans/review', { signal: controller.signal });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as any));
      throw new Error(body?.error || `Failed to load inbox (${res.status})`);
    }
    const items = (await res.json()) as InboxItem[];
    // Defensive filter
    return (items || []).filter((row) => (row?.total_detections ?? 0) > 0);
  } finally {
    clearTimeout(timeout);
  }
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
