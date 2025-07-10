import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

// PATCH /api/scans/[id] - for renaming
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // Get user_id from request headers (set by frontend)
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - User ID required' }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { id } = params;
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
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - User ID required' }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { id } = params;

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