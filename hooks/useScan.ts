import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/browser';

export interface ScanRecord {
  id: string;
  title: string | null;
  status?: string | null;
  processing_status?: string | null; // legacy scan_uploads column
  progress?: number | null;
  storage_path?: string | null;
  summary_image_path?: string | null;
  created_at?: string;
}

/**
 * Unified fetch for a scan row. Looks in `scan_uploads` first (legacy)
 * then falls back to `scans`.
 */
async function fetchScan(scanId: string): Promise<ScanRecord | null> {
  const supabase = getSupabaseClient();

  // 1. scan_uploads (newest pipeline)
  const {
    data: uploadData,
    error: uploadErr,
  } = await supabase.from('scan_uploads').select('*').eq('id', scanId).single();

  if (uploadData) return uploadData as ScanRecord;

  if (uploadErr?.code !== 'PGRST116') {
    // Real error other than "row not found"
    throw uploadErr;
  }

  // 2. fallback to legacy scans
  const { data: scanData, error: scanErr } = await supabase
    .from('scans')
    .select('*')
    .eq('id', scanId)
    .single();

  if (scanErr) throw scanErr;
  return scanData as ScanRecord;
}

/**
 * Hook: returns scan data + loading & error state.
 */
export function useScan(scanId: string | undefined) {
  return useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => {
      if (!scanId) return Promise.resolve(null);
      return fetchScan(scanId);
    },
    enabled: Boolean(scanId),
    staleTime: 30 * 1000, // 30 s – scans rarely change after completion
  });
}
