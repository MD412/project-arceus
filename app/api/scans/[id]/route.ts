import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

async function requireUser() {
  const supabaseUserCtx = await supabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabaseUserCtx.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { user };
}

// GET /api/scans/[id] - fetch scan details with cards
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = params;

  const supabase = supabaseAdmin();

  try {
    const { data: scan, error: scanError } = await supabase
      .from('scan_uploads')
      .select('*')
      .eq('id', id)
      .single();

    if (scanError || !scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    if (scan.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    scanIdForDetections = scanIdForDetections || id;

    const { data: detections, error: detectionsError } = await supabase
      .from('card_detections')
      .select(
        `
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
      `,
      )
      .eq('scan_id', scanIdForDetections)
      .order('tile_source', { ascending: true });

    if (detectionsError) {
      console.error('Error fetching detections:', detectionsError);
    }

    const enrichedCards = (detections ?? []).map((detection, index) => {
      const c = (detection as any).card || {};
      // Extract image URL from image_urls JSON field (pokemontcg.io API images)
      const imageUrl = c.image_urls?.small || c.image_urls?.large || null;
      const cardName = c.name || 'Unknown Card';

      // Debug logging to trace image URL issues
      if (!imageUrl && c.id) {
        console.log('[SCAN API] Missing image_url for card:', { 
          card_id: c.id, 
          card_name: cardName,
          image_urls: c.image_urls,
          has_image_urls: !!c.image_urls 
        });
      }

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
        image_url: imageUrl,
      };
    });

    const scanWithCards = {
      ...scan,
      binder_title: scan.scan_title,
      results: {
        ...scan.results,
        enriched_cards: enrichedCards,
        total_cards_detected: enrichedCards.length,
        original_image_width: 3456,
        original_image_height: 4608,
      },
    };

    return NextResponse.json(scanWithCards, { status: 200 });
  } catch (err: any) {
    console.error(`Error in GET /api/scans/${id}:`, err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/scans/[id] - for renaming
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = params;
  const { scan_title } = await request.json();

  if (!scan_title) {
    return NextResponse.json({ error: 'New title is required' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('scan_uploads')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error: updateError } = await supabase
      .from('scan_uploads')
      .update({ scan_title })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(
      { message: 'Scan renamed successfully', scan: data },
      { status: 200 },
    );
  } catch (err: any) {
    console.error(`Error in PATCH /api/scans/${id}:`, err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/scans/[id]
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = params;
  const supabase = supabaseAdmin();

  try {
    const { data: scan, error: scanError } = await supabase
      .from('scan_uploads')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (scanError || !scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    if (scan.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: softErr } = await supabase
      .from('scan_uploads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (softErr) {
      console.error('Soft delete error:', softErr);
      throw softErr;
    }

    const { error: qErr } = await supabase.from('command_queue').insert({
      type: 'DELETE_SCAN',
      payload: { scanId: id, userId: user.id },
    });

    if (qErr) {
      console.error('Enqueue error:', qErr);
      return NextResponse.json({ error: 'Failed to enqueue delete command' }, { status: 500 });
    }

    return NextResponse.json({ accepted: true }, { status: 202 });
  } catch (err: any) {
    console.error(`Error in DELETE /api/scans/${id}:`, err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

