import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/scans/review
 * Returns inbox items for the current user with detection counts.
 * Criteria:
 * - scans.status = 'ready' (ready for review)
 * - total_detections > 0 (computed from card_detections)
 */
export async function GET(_request: NextRequest) {
  const supabaseUserCtx = await supabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabaseUserCtx.auth.getUser();

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const admin = supabaseAdmin();

  try {
    // 1) Fetch scans that are ready for review for this user
    const { data: scans, error: scansError } = await admin
      .from('scans')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .eq('status', 'ready')
      .order('created_at', { ascending: false });

    if (scansError) throw scansError;

    const scanRows = scans || [];
    if (scanRows.length === 0) {
      return NextResponse.json([]);
    }

    const scanIds = scanRows.map((s: any) => s.id);

    // 2) Fetch detections for those scans and count per scan_id
    const { data: detRows, error: detError } = await admin
      .from('card_detections')
      .select('id, scan_id')
      .in('scan_id', scanIds);

    if (detError) throw detError;

    const countByScan = new Map<string, number>();
    for (const row of detRows || []) {
      const key = (row as any).scan_id as string;
      countByScan.set(key, (countByScan.get(key) || 0) + 1);
    }

    // 3) Build response items, filtering out zero-detection scans
    const items = scanRows
      .map((s: any) => ({
        id: s.id as string,
        title: (s.title as string) ?? s.id,
        created_at: s.created_at as string,
        total_detections: countByScan.get(s.id) || 0,
      }))
      .filter((i) => i.total_detections > 0);

    return NextResponse.json(items);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}


























































