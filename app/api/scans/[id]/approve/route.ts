import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// POST /api/scans/[id]/approve
// Approves a scan by creating/upserting user_cards for all detections with a guessed card
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // this is scan_uploads.id (view over scans)
  const supabase = await supabaseAdmin();

  try {
    // 1) Load scan_upload row (view) to get user_id
    const { data: upload, error: uploadErr } = await supabase
      .from('scan_uploads')
      .select('id, user_id')
      .eq('id', id)
      .single();
    if (uploadErr || !upload) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // 2) In this schema, scan_uploads.id is scans.id (view over scans)
    const scanId: string = id;

    // 3) Fetch detections (both mapped and unmapped)
    const { data: detections, error: detErr } = await supabase
      .from('card_detections')
      .select('id, guess_card_id, guess_external_id')
      .eq('scan_id', scanId)
    if (detErr) {
      return NextResponse.json({ error: detErr.message }, { status: 500 });
    }

    const rows = detections ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ message: 'No detections for this scan', count: 0 });
    }

    // 3.5) Auto-map external IDs → cards.id, backfill detections where missing
    const missing = rows.filter((r) => !r.guess_card_id && r.guess_external_id);
    const externalIds = Array.from(new Set(missing.map((r) => r.guess_external_id as string)));
    const source = 'sv_text';

    if (externalIds.length > 0) {
      // a) look up existing mappings in card_keys
      const { data: keyRows } = await supabase
        .from('card_keys')
        .select('external_id, card_id')
        .eq('source', source)
        .in('external_id', externalIds);
      const keyMap = new Map<string, string>((keyRows || []).map((k: any) => [k.external_id, k.card_id]));

      // b) find remaining in cards by pokemon_tcg_api_id
      const remainingA = externalIds.filter((e) => !keyMap.has(e));
      if (remainingA.length > 0) {
        const { data: cardRows } = await supabase
          .from('cards')
          .select('id, pokemon_tcg_api_id')
          .in('pokemon_tcg_api_id', remainingA);
        for (const c of cardRows || []) {
          keyMap.set(c.pokemon_tcg_api_id, c.id);
        }
      }

      // c) create cards for any still-missing IDs using embeddings metadata
      const remainingB = externalIds.filter((e) => !keyMap.has(e));
      if (remainingB.length > 0) {
        const { data: embRows } = await supabase
          .from('card_embeddings')
          .select('card_id, name, set_code, card_number, rarity, image_url')
          .in('card_id', remainingB);
        const inserts = (embRows || []).map((e: any) => ({
          pokemon_tcg_api_id: e.card_id,
          name: e.name || `Card ${e.card_id}`,
          set_code: e.set_code || null,
          card_number: e.card_number || null,
          rarity: e.rarity || null,
          image_urls: e.image_url ? { small: e.image_url } : null,
        }));
        if (inserts.length > 0) {
          const { data: created } = await supabase
            .from('cards')
            .insert(inserts)
            .select('id, pokemon_tcg_api_id');
          for (const c of created || []) {
            keyMap.set(c.pokemon_tcg_api_id, c.id);
          }
        }
      }

      // d) upsert mappings into card_keys for future fast resolution
      const upserts = externalIds
        .filter((e) => keyMap.get(e))
        .map((e) => ({ source, external_id: e, card_id: keyMap.get(e) as string }));
      if (upserts.length > 0) {
        await supabase.from('card_keys').upsert(upserts, { onConflict: 'source,external_id' });
      }

      // e) update detections with newly resolved UUIDs
      const updates = missing
        .map((m) => ({ id: m.id, uuid: keyMap.get(m.guess_external_id as string) }))
        .filter((u) => Boolean(u.uuid)) as { id: string; uuid: string }[];
      for (const u of updates) {
        await supabase.from('card_detections').update({ guess_card_id: u.uuid }).eq('id', u.id);
      }
    }

    // 4) Insert into user_cards, avoiding duplicates manually (no unique constraint yet)
    // Refresh detections with mapped UUIDs
    const { data: mapped } = await supabase
      .from('card_detections')
      .select('id, guess_card_id')
      .eq('scan_id', scanId)
      .not('guess_card_id', 'is', null);
    const detectionIds = (mapped || []).map((d: any) => d.id as string);
    // Idempotency: skip only if we already created a row for this detection
    const { data: existingByDetection } = await supabase
      .from('user_cards')
      .select('detection_id')
      .in('detection_id', detectionIds);
    const existingDetectionSet = new Set((existingByDetection ?? []).map((r: any) => r.detection_id));

    const toInsert = (mapped || [])
      .filter((d) => !existingDetectionSet.has(d.id))
      .map((d) => ({
        user_id: upload.user_id,
        detection_id: d.id,
        card_id: d.guess_card_id,
        condition: 'unknown' as const,
      }));

    if (toInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from('user_cards')
        .insert(toInsert);
      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    // 5) Mark scan as completed so it no longer appears in inbox views
    const { error: statusErrA } = await supabase
      .from('scans')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', scanId);
    if (statusErrA) {
      // Fallback: attempt via the compatibility view
      const { error: statusErrB } = await supabase
        .from('scan_uploads')
        .update({ processing_status: 'completed' })
        .eq('id', scanId);
      if (statusErrB) {
        console.error('Failed to mark scan completed:', statusErrA?.message, statusErrB?.message);
        return NextResponse.json({ error: 'Failed to finalize scan status' }, { status: 500 });
      }
    }

    return NextResponse.json({ approved: toInsert.length, scan_id: scanId, status: 'completed' });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}


