import { getSupabaseClient } from '@/lib/supabase/browser';

const supabase = getSupabaseClient();

export async function getCards(userId: string) {
  // Prefer server API to bypass client-side RLS/nested-select issues
  const res = await fetch(`/api/collections`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as any));
    throw new Error(body?.error || `Failed to fetch collections (${res.status})`);
  }
  const body = await res.json();
  const cards = (body?.cards || []) as any[];
  return cards.map((uc: any) => ({
    id: uc.id,
    name: uc.card?.name || '',
    number: uc.card?.card_number || '',
    set_code: uc.card?.set_code || '',
    set_name: uc.card?.set_name || '',
    image_url: uc.card?.image_url || '',
    raw_crop_url: uc.raw_crop_url || null,
    user_id: userId,
    created_at: uc.created_at,
    quantity: uc.quantity || 1,
    condition: uc.condition || 'Near Mint',
  })).filter((c) => c.name);
}

export async function deleteCard(userCardId: string) {
  const { error } = await supabase
    .from('user_cards')
    .delete()
    .eq('id', userCardId);

  if (error) {
    throw new Error(error.message);
  }

  return userCardId;
}

export async function updateCardQuantity(userCardId: string, quantity: number) {
  const { error } = await supabase
    .from('user_cards')
    .update({ quantity })
    .eq('id', userCardId);

  if (error) {
    throw new Error(error.message);
  }

  return userCardId;
}

export async function updateCardCondition(userCardId: string, condition: string) {
  const { error } = await supabase
    .from('user_cards')
    .update({ condition })
    .eq('id', userCardId);

  if (error) {
    throw new Error(error.message);
  }

  return userCardId;
}

// Replace an owned card (user_cards row) with a different cards.id
export async function replaceUserCard(
  userCardId: string,
  replacement: { id: string; set_code?: string; card_number?: string }
) {
  const res = await fetch(`/api/user-cards/${encodeURIComponent(userCardId)}/replace`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ replacement }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as any));
    throw new Error(body?.error || `Failed to replace card (${res.status})`);
  }
  return userCardId;
}

export interface ScanData {
  id: string;
  title: string;
  status: string;
  created_at: string;
  summary_image_path?: string;
  user_id: string;
}

export interface CardDetection {
  id: string;
  scan_id: string;
  confidence: number;
  bbox: [number, number, number, number];
  crop_url?: string;
  guess_card_id?: string;
  cards?: {
    id: string;
    name: string;
    set_code: string;
    card_number: string;
    image_url: string;
    rarity: string;
    market_price: number | null;
  };
}

export interface ScanWithDetections {
  scan: ScanData;
  detections: CardDetection[];
}

export async function getScanWithDetections(scanId: string): Promise<ScanWithDetections> {
  const supabase = getSupabaseClient();
  
  // First try the scan_uploads table (current system)
  const { data: scanUpload, error: uploadError } = await supabase
    .from('scan_uploads')
    .select('*')
    .eq('id', scanId)
    .single();

  let scanData: ScanData;
  let actualScanId = scanId;

  if (uploadError && uploadError.code !== 'PGRST116') {
    throw uploadError;
  }

  if (scanUpload) {
    // Using scan_uploads table
    scanData = {
      id: scanUpload.id,
      title: scanUpload.scan_title,
      status: scanUpload.processing_status,
      created_at: scanUpload.created_at,
      summary_image_path: scanUpload.results?.summary_image_path,
      user_id: scanUpload.user_id
    };
    // Check if there's a linked scan in the scans table
    actualScanId = scanUpload.results?.scan_id || scanId;
  } else {
    // Try the scans table directly
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single();

    if (scanError) throw scanError;
    scanData = scan;
  }

  // Fetch detections with card data using the actual scan ID
  const { data: detectionsData, error: detectionsError } = await supabase
    .from('card_detections')
    .select(`
      *,
      cards:guess_card_id (
        id,
        name,
        set_code,
        card_number,
        image_url,
        rarity,
        market_price
      )
    `)
    .eq('scan_id', actualScanId)
    .order('created_at', { ascending: true });

  if (detectionsError) {
    throw detectionsError;
  }

  return {
    scan: scanData,
    detections: detectionsData || []
  };
} 

export async function updateDetection(detectionId: string, updates: { guess_card_id: string }) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('card_detections')
    .update(updates)
    .eq('id', detectionId);

  if (error) {
    throw error;
  }

  return { success: true };
} 
