import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/commands/delete-scan
 * Body: { scanId: string }
 *
 * 1. Soft-delete the scan_uploads row (set deleted_at, bump version)
 * 2. Enqueue a DELETE_SCAN command in command_queue for background cleanup
 * 3. Return 202 Accepted quickly so UI can remain optimistic
 */
export async function POST(request: NextRequest) {
  const supabaseUserCtx = await supabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabaseUserCtx.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { scanId } = await request.json();
  if (!scanId || typeof scanId !== 'string') {
    return NextResponse.json({ error: 'scanId is required' }, { status: 400 });
  }

  const adminClient = supabaseAdmin();

  const { data: scan, error: scanError } = await adminClient
    .from('scan_uploads')
    .select('id, user_id')
    .eq('id', scanId)
    .single();

  if (scanError || !scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }

  if (scan.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Soft delete by updating the base table (scans), not the view
    const { error: updateError } = await adminClient
      .from('scans')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', scanId)
      .eq('user_id', user.id);

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
      }
      throw updateError;
    }

    const { error: enqueueError } = await adminClient.from('command_queue').insert({
      type: 'DELETE_SCAN',
      payload: { scanId, userId: user.id },
    });

    if (enqueueError) {
      console.error('Failed to enqueue DELETE_SCAN command:', enqueueError);
      return NextResponse.json({ error: 'Failed to enqueue delete command' }, { status: 500 });
    }

    return NextResponse.json({ accepted: true, commandType: 'DELETE_SCAN' }, { status: 202 });
  } catch (error: any) {
    console.error('Error in POST /api/commands/delete-scan:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
