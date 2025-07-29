import { supabaseAdmin } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/commands/delete-scan
 * Body: { scanId: string }
 * Headers: x-user-id must be provided by frontend
 *
 * 1. Soft-delete the scan_uploads row (set deleted_at, bump version)
 * 2. Enqueue a DELETE_SCAN command in command_queue for background cleanup
 * 3. Return 202 Accepted quickly so UI can remain optimistic
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - User ID required' }, { status: 401 });
  }

  const { scanId } = await request.json();
  if (!scanId) {
    return NextResponse.json({ error: 'scanId is required' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  try {
    // 1) Soft delete (mark deleted_at)
    const { error: updateError } = await supabase
      .from('scan_uploads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', scanId)
      .eq('user_id', userId);

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Scan not found or no permission' }, { status: 404 });
      }
      throw updateError;
    }

    // 2) Enqueue command for background processing
    const { error: enqueueError } = await supabase.from('command_queue').insert({
      type: 'DELETE_SCAN',
      payload: { scanId, userId },
    });

    if (enqueueError) {
      console.error('Failed to enqueue DELETE_SCAN command:', enqueueError);
      // Note: we do NOT roll back the soft delete; surface error so UI can retry enqueue if desired
      return NextResponse.json({ error: 'Failed to enqueue delete command' }, { status: 500 });
    }

    return NextResponse.json({ accepted: true, commandType: 'DELETE_SCAN' }, { status: 202 });
  } catch (error: any) {
    console.error('Error in POST /api/commands/delete-scan:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 