import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

// GET /api/scans/[id] - fetch scan details with cards
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const { id } = await params;

  try {
    // Fetch scan details
    const { data: scan, error: scanError } = await supabase
      .from('scan_uploads')
      .select('*')
      .eq('id', id)
      .single();

    if (scanError) {
      if (scanError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
      }
      throw scanError;
    }

    // Fetch card detections with card details
    // Prefer the scans.id captured in results; otherwise map via storage_path → scans.id
    let scanIdForDetections = scan.results?.scan_id as string | undefined;
    if (!scanIdForDetections && scan.storage_path) {
      const { data: scanRow } = await supabase
        .from('scans')
        .select('id')
        .eq('storage_path', scan.storage_path)
        .maybeSingle();
      if (scanRow?.id) {
        scanIdForDetections = scanRow.id;
      }
    }
    // Final fallback to provided id if nothing else found
    scanIdForDetections = scanIdForDetections || id;
    
    // Join to canonical cards via UUID guess_card_id
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
          image_urls,
          market_price
        )
      `)
      .eq('scan_id', scanIdForDetections)
      .order('tile_source', { ascending: true });

    if (detectionsError) {
      console.error('Error fetching detections:', detectionsError);
    }


    // Transform the data to match the expected format (simplified approach)
    const enrichedCards = (detections ?? []).map((detection, index) => {
      const c = (detection as any).card || {};
      const imageUrl = c.image_url || c.image_urls?.small || null;
      const cardName = c.name || 'Unknown Card';

      return {
        card_index: index,
        bounding_box: detection.bbox,
        cropped_image_path: detection.crop_url,
        enrichment_success: !!detection.guess_card_id,
        card_name: cardName,
        set_name: c.set_name || '',
        set_code: c.set_code || '',
        card_number: c.card_number || '',
        rarity: c.rarity || '',
        market_price: c.market_price ?? null,
        identification_confidence: (detection.confidence || 0) * 100,
        error_message: detection.guess_card_id ? null : 'Card not identified',
        detection_id: detection.id,
        card_id: detection.guess_card_id,
        image_url: imageUrl
      };
    });

    // Merge the data
    const scanWithCards = {
      ...scan,
      binder_title: scan.scan_title,
      results: {
        ...scan.results,
        enriched_cards: enrichedCards,
        total_cards_detected: enrichedCards.length,
        original_image_width: 3456, // TODO: Get from actual image metadata
        original_image_height: 4608
      }
    };

    return NextResponse.json(scanWithCards, { status: 200 });
  } catch (error: any) {
    console.error(`Error in GET /api/scans/${id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/scans/[id] - for renaming
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Get user_id from request headers (set by frontend)
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - User ID required' }, { status: 401 });
  }

  const supabase = await supabaseServer();

  const { id } = await params;
  const { scan_title } = await request.json();

  if (!scan_title) {
    return NextResponse.json({ error: 'New title is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('scan_uploads')
      .update({ scan_title })
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only update their own scans
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Scan not found or you do not have permission to update it' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Scan renamed successfully', scan: data }, { status: 200 });
  } catch (error: any) {
    console.error(`Error in PATCH /api/scans/${id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/scans/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - User ID required' }, { status: 401 });
  }

  const supabase = await supabaseServer();
  const { id } = await params;

  try {
    console.log(`🗑️ DELETE (soft) request for scan: ${id}, user: ${userId}`);

    // Ensure scan belongs to user
    const { error: ownershipError } = await supabase
      .from('scan_uploads')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (ownershipError) {
      const status = ownershipError.code === 'PGRST116' ? 404 : 500;
      return NextResponse.json({ error: 'Scan not found or no permission' }, { status });
    }

    // 1) Soft delete
    const { error: softErr } = await supabase
      .from('scan_uploads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (softErr) {
      console.error('Soft delete error:', softErr);
      throw softErr;
    }

    // 2) Enqueue command
    const { error: qErr } = await supabase.from('command_queue').insert({
      type: 'DELETE_SCAN',
      payload: { scanId: id, userId },
    });

    if (qErr) {
      console.error('Enqueue error:', qErr);
      return NextResponse.json({ error: 'Failed to enqueue delete command' }, { status: 500 });
    }

    console.log('✅ Soft delete + enqueue successful');
    return NextResponse.json({ accepted: true }, { status: 202 });
  } catch (error: any) {
    console.error(`💥 Error in DELETE /api/binders/${id}:`, error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 