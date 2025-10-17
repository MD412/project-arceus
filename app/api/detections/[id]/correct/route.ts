import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server';

// PATCH /api/detections/[id]/correct
// Resolves a replacement card and updates card_detections.guess_card_id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabaseUserCtx = await supabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabaseUserCtx.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params; // card_detections.id
  const supabase = supabaseAdmin();

  const { data: detection, error: detectionError } = await supabase
    .from('card_detections')
    .select('id, scan_id')
    .eq('id', id)
    .single();

  if (detectionError || !detection) {
    return NextResponse.json({ error: 'Detection not found' }, { status: 404 });
  }

  const { data: scan, error: scanError } = await supabase
    .from('scan_uploads')
    .select('id, user_id')
    .eq('id', detection.scan_id)
    .maybeSingle();

  if (scanError) {
    console.error('Error checking scan ownership:', scanError);
  }

  if (!scan) {
    const { data: fallbackScan, error: fallbackError } = await supabase
      .from('scans')
      .select('id, user_id')
      .eq('id', detection.scan_id)
      .maybeSingle();
    if (fallbackError) {
      console.error('Error checking fallback scan ownership:', fallbackError);
    }
    if (!fallbackScan || fallbackScan.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else if (scan.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { replacement } = body as {
      replacement?: { id: string; set_code?: string; card_number?: string };
    };
    if (!replacement?.id) {
      return NextResponse.json({ error: 'replacement.id is required' }, { status: 400 });
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let cardId: string | null = null;

    if (uuidRegex.test(replacement.id)) {
      cardId = replacement.id;
    } else {
      // 1) Direct lookup by pokemon_tcg_api_id
      const { data: byExt } = await supabase
        .from('cards')
        .select('id')
        .eq('pokemon_tcg_api_id', replacement.id)
        .maybeSingle();
      if (byExt?.id) {
        cardId = byExt.id as string;
      }

      // 2) Lookup by set_code + card_number
      if (!cardId && replacement.set_code && replacement.card_number) {
        const { data: bySet } = await supabase
          .from('cards')
          .select('id')
          .eq('set_code', replacement.set_code)
          .eq('card_number', replacement.card_number)
          .maybeSingle();
        if (bySet?.id) {
          cardId = bySet.id as string;
        }
      }

      // 3) Fallback to card_embeddings to create the card if needed
      if (!cardId) {
        const { data: emb } = await supabase
          .from('card_embeddings')
          .select('card_id, name, set_code, card_number, rarity, image_url')
          .eq('card_id', replacement.id)
          .maybeSingle();
        if (emb) {
          const insert = {
            pokemon_tcg_api_id: emb.card_id,
            name: emb.name || `Card ${emb.card_id}`,
            set_code: emb.set_code || null,
            card_number: emb.card_number || null,
            rarity: emb.rarity || null,
            image_urls: emb.image_url ? { small: emb.image_url } : null,
          } as any;
          const { data: created, error: insertErr } = await supabase
            .from('cards')
            .upsert(insert, { onConflict: 'pokemon_tcg_api_id' })
            .select('id')
            .maybeSingle();
          if (insertErr) {
            return NextResponse.json({ error: insertErr.message }, { status: 400 });
          }
          if (created?.id) {
            cardId = created.id as string;
          }
        }
      }
    }

    if (!cardId) {
      return NextResponse.json({ error: 'Could not resolve target card' }, { status: 400 });
    }

    // Update the detection row
    const { data: updated, error: updErr } = await supabase
      .from('card_detections')
      .update({ guess_card_id: cardId })
      .eq('id', id)
      .select('id, guess_card_id')
      .maybeSingle();
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    return NextResponse.json({ detection: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}














