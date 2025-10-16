import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabaseUserCtx = await supabaseServer();
    const {
      data: { user },
      error: userError,
    } = await supabaseUserCtx.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { card_id, detection_id, condition, quantity } = body;

    if (!card_id) {
      return NextResponse.json({ error: 'card_id is required' }, { status: 400 });
    }

    const adminClient = supabaseAdmin();

    if (detection_id) {
      const { data: detection, error: detectionError } = await adminClient
        .from('card_detections')
        .select('id, scan_id')
        .eq('id', detection_id)
        .single();

      if (detectionError || !detection) {
        return NextResponse.json({ error: 'Detection not found' }, { status: 404 });
      }

      const { data: scan, error: scanError } = await adminClient
        .from('scan_uploads')
        .select('id, user_id')
        .eq('id', detection.scan_id)
        .maybeSingle();

      if (scanError) {
        console.error('Failed to verify detection ownership:', scanError);
      }

      if (!scan || scan.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { data, error } = await adminClient
      .from('user_cards')
      .insert({
        user_id: user.id,
        card_id,
        detection_id: detection_id ?? null,
        condition: condition || 'unknown',
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
