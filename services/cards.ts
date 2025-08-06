import { getSupabaseClient } from '@/lib/supabase/browser';

const supabase = getSupabaseClient();

export async function getCards(userId: string) {
  const { data, error } = await supabase
    .from('user_cards')
    .select(`
      id,
      quantity,
      condition,
      created_at,
      card:cards(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // Transform the nested data to match the expected CardEntry interface
  return data?.map((userCard: any) => ({
    id: userCard.id, // user_cards id for deletion
    name: userCard.card?.name || '',
    number: userCard.card?.card_number || '',
    set_code: userCard.card?.set_code || '',
    set_name: userCard.card?.set_name || '',
    image_url: userCard.card?.image_url || '',
    user_id: userId,
    created_at: userCard.created_at,
    quantity: userCard.quantity || 1,
    condition: userCard.condition || 'Near Mint',
  })).filter((card: any) => card.name) || [];
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