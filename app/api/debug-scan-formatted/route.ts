import { supabaseAdmin } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = supabaseAdmin();

  const SCAN_ID = '37c0565e-0b06-4d9a-846d-b9a772354e0d';

  try {
    // Fetch scan details
    const { data: scan, error: scanError } = await supabase
      .from('scan_uploads')
      .select('*')
      .eq('id', SCAN_ID)
      .single();

    if (scanError || !scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Use the actual scan_id from results
    const scanIdForDetections = scan.results?.scan_id || SCAN_ID;
    
    // Fetch card detections with card details
    const { data: detections, error: detectionsError } = await supabase
      .from('card_detections')
      .select(`
        *,
        card:guess_card_id (
          id,
          name,
          set_code,
          set_name,
          card_number,
          rarity,
          image_url,
          market_price
        )
      `)
      .eq('scan_id', scanIdForDetections)
      .order('tile_source', { ascending: true });

    // Transform the data to match the expected format
    const enrichedCards = (detections ?? []).map((detection, index) => {
      const cardName = detection.card?.name || 'Unknown Card';

      return {
        card_index: index,
        bounding_box: detection.bbox,
        cropped_image_path: detection.crop_url,
        enrichment_success: !!detection.guess_card_id,
        card_name: cardName,
        set_name: detection.card?.set_name || '',
        set_code: detection.card?.set_code || '',
        card_number: detection.card?.card_number || '',
        rarity: detection.card?.rarity || '',
        market_price: detection.card?.market_price || null,
        identification_confidence: (detection.confidence || 0) * 100,
        error_message: detection.guess_card_id ? null : 'Card not identified',
        detection_id: detection.id,
        card_id: detection.guess_card_id,
        is_training_candidate: detection.is_training_candidate,
        training_flagged_at: detection.training_flagged_at,
        image_url: detection.card?.image_url
      };
    });

    // Get summary image path
    let summaryImagePath: string | null = scan.results?.summary_image_path || null;
    if (!summaryImagePath && scan.results?.scan_id) {
      const { data: scanRow } = await supabase
        .from('scans')
        .select('summary_image_path')
        .eq('id', scan.results.scan_id)
        .single();
      if (scanRow?.summary_image_path) {
        summaryImagePath = scanRow.summary_image_path;
      }
    }

    // Format the response to match what the frontend expects
    const scanWithCards = {
      ...scan,
      binder_title: scan.scan_title || 'Untitled Scan',
      results: {
        ...scan.results,
        summary_image_path: summaryImagePath,
        enriched_cards: enrichedCards,
        total_cards_detected: enrichedCards.length,
        original_image_width: 3456,
        original_image_height: 4608,
        enrichment_stats: {
          successful: enrichedCards.filter(c => c.enrichment_success).length,
          failed: enrichedCards.filter(c => !c.enrichment_success).length,
          total_time_ms: 1000 // Mock value
        }
      }
    };

    return NextResponse.json(scanWithCards, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Debug scan error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 