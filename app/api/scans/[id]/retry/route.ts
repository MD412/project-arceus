import { supabaseAdmin } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Use the service role key to bypass RLS
  const supabase = supabaseAdmin();
  
  const { id } = params;

  try {
    // Step 1: Get the original scan upload record
    const { data: upload, error: uploadError } = await supabase
      .from('scan_uploads')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (uploadError || !upload) {
      return NextResponse.json({ error: 'Scan upload not found or permission denied' }, { status: 404 });
    }

    // Step 2: Create a NEW job in the job_queue for the worker to find
    const { error: jobError } = await supabase.from('job_queue').insert({
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
    
    // Step 3: If job creation is successful, THEN update the original record's status
    const { error: updateError } = await supabase
      .from('scan_uploads')
      .update({ processing_status: 'pending' })
      .eq('id', id);

    if (updateError) {
      console.warn(`Successfully created job for scan ${id}, but failed to update the scan_uploads status.`);
    }

    return NextResponse.json({
      success: true,
      message: 'Scan has been successfully re-queued for processing.',
    });

  } catch (error) {
    console.error('Unexpected retry error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during the retry process.' },
      { status: 500 }
    );
  }
} 