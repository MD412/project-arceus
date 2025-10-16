import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  _request: NextRequest,
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

  const { id } = params;
  const adminClient = supabaseAdmin();

  try {
    const { data: upload, error: uploadError } = await adminClient
      .from('scan_uploads')
      .select('storage_path, user_id')
      .eq('id', id)
      .single();

    if (uploadError || !upload) {
      return NextResponse.json({ error: 'Scan upload not found' }, { status: 404 });
    }

    if (upload.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!upload.storage_path) {
      return NextResponse.json({ error: 'Scan has no storage path' }, { status: 400 });
    }

    const { error: jobError } = await adminClient.from('job_queue').insert({
      scan_upload_id: id,
      status: 'pending',
      job_type: 'process_scan_page',
      payload: {
        storage_path: upload.storage_path,
      },
    });

    if (jobError) {
      console.error('Error creating job:', jobError);
      return NextResponse.json({ error: 'Failed to create new job in queue' }, { status: 500 });
    }

    const { error: updateError } = await adminClient
      .from('scan_uploads')
      .update({ processing_status: 'pending' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.warn(
        `Successfully created job for scan ${id}, but failed to update the scan_uploads status.`,
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Scan has been successfully re-queued for processing.',
    });
  } catch (error: any) {
    console.error('Unexpected retry error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred during the retry process.' },
      { status: 500 },
    );
  }
}
