import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/browser';

export interface CardLite {
  id: string;
  name: string;
  set_code: string | null;
  card_number: string | null;
  image_url: string | null;
}

export interface DetectionRecord {
  id: string;
  scan_id: string;
  guess_card_id: string | null;
  confidence: number | null;
  bbox: number[]; // [x,y,w,h]
  crop_url: string | null;
  created_at?: string; // ISO timestamp from database
  cards?: CardLite | null; // nested join result
}

// ---------- Queries ---------- //
/**
 * Fetch detections for either a `scans.id` or a legacy `scan_uploads.id`.
 * If no detections are found for the provided id we try to map the upload row
 * to its generated scans row via `storage_path`.
 */
async function fetchDetections(scanId: string): Promise<DetectionRecord[]> {
  const supabase = getSupabaseClient();

  // Preferred: use server API for read (RLS-safe, enriched)
  try {
    const res = await fetch(`/api/scans/${scanId}`, { method: 'GET' });
    if (res.ok) {
      const payload = await res.json();
      const enriched = payload?.results?.enriched_cards ?? [];
      return enriched.map((e: any) => ({
        id: e.detection_id,
        scan_id: payload.results?.scan_id || scanId,
        guess_card_id: e.card_id,
        confidence: (e.identification_confidence ?? 0) / 100,
        bbox: e.bounding_box,
        crop_url: e.cropped_image_path,
        // Attach card details for UI
        // @ts-ignore
        card: {
          id: e.card_id,
          name: e.card_name,
          set_code: e.set_code,
          card_number: e.card_number,
          image_url: e.image_url,
        } as CardLite,
      })) as (DetectionRecord & { card?: CardLite | null })[];
    }
  } catch (_ignore) {
    // fall back to direct query
  }

  // Fallback: direct table queries with RLS, including legacy mapping by storage_path
  const queryByScanId = async (id: string) => {
    const { data, error } = await supabase
      .from('card_detections')
      .select(`*, cards:guess_card_id (id, name, set_code, card_number, image_urls)`) 
      .eq('scan_id', id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    const detections = (data || []) as DetectionRecord[];
    return detections.map((d: any) => {
      const c = d.cards || {};
      const normalized: CardLite | null = c ? {
        id: c.id,
        name: c.name,
        set_code: c.set_code,
        card_number: c.card_number,
        image_url: c.image_urls?.small || c.image_urls?.large || null,
      } : null;
      return { ...d, card: normalized } as DetectionRecord & { card?: CardLite | null };
    });
  };

  // First attempt: assume provided id IS the scans.id
  let detections = await queryByScanId(scanId);
  if (detections.length > 0) return detections;

  // Fallback: treat id as scan_uploads.id → get scan_id from results
  const { data: uploadRow } = await supabase
    .from('scan_uploads')
    .select('storage_path, results')
    .eq('id', scanId)
    .single();

  if (!uploadRow?.results?.scan_id) {
    // Legacy fallback: try scans table lookup
    if (!uploadRow?.storage_path) return [];

    const { data: scanRow } = await supabase
      .from('scans')
      .select('id')
      .eq('storage_path', uploadRow.storage_path)
      .single();

    if (!scanRow?.id) return [];

    detections = await queryByScanId(scanRow.id);
    return detections;
  }

  // Use scan_id from results
  const actualScanId = uploadRow.results.scan_id;
  detections = await queryByScanId(actualScanId);
  return detections;
}

export function useDetections(scanId: string | undefined) {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  // core query
  const detectionsQuery = useQuery({
    queryKey: ['detections', scanId],
    enabled: Boolean(scanId),
    queryFn: () => fetchDetections(scanId as string),
    staleTime: 15 * 1000,
  });

  // ---- Mutations ---- //
  const correctMutation = useMutation({
    mutationFn: async ({ detectionId, replacement }: { detectionId: string; replacement: { id: string; set_code?: string; card_number?: string } }) => {
      console.log('Updating detection', detectionId, 'to replacement', replacement);
      const res = await fetch(`/api/detections/${encodeURIComponent(detectionId)}/correct`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replacement }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as any));
        throw new Error(body?.error || `Failed to correct detection (${res.status})`);
      }
      return { detectionId, cardId: replacement.id } as any;
    },
    // optimistic
    onMutate: async ({ detectionId, replacement }) => {
      await queryClient.cancelQueries({ queryKey: ['detections', scanId] });
      const previous = queryClient.getQueryData<DetectionRecord[]>(['detections', scanId]);
      if (previous) {
        const optimistic = previous.map((d) =>
          d.id === detectionId ? { ...d, guess_card_id: replacement.id } : d
        );
        queryClient.setQueryData(['detections', scanId], optimistic);
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['detections', scanId], context.previous);
      }
    },
    onSuccess: async () => {
      console.log('Mutation successful, invalidating cache');
      // Force refetch to get the updated card data
      await queryClient.invalidateQueries({ queryKey: ['detections', scanId] });
      console.log('Cache invalidated');
    },
  });

  // bulk approve / reject
  const bulkMutation = useMutation({
    mutationFn: async ({ action }: { action: 'approve' | 'reject' }) => {
      if (!scanId) throw new Error('No scanId');
      // TODO: replace with dedicated API routes once created
      if (action === 'approve') {
        return supabase.rpc('approve_scan', { scan_id_input: scanId });
      }
      return supabase.rpc('reject_scan', { scan_id_input: scanId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan', scanId] });
    },
  });

  return {
    ...detectionsQuery,
    correctDetection: (detectionId: string, cardId: string | { id: string; set_code?: string; card_number?: string }) =>
      correctMutation.mutateAsync({ detectionId, replacement: typeof cardId === 'string' ? { id: cardId } : cardId }),
    approveAll: () => bulkMutation.mutate({ action: 'approve' }),
    rejectAll: () => bulkMutation.mutate({ action: 'reject' }),
  };
}
