import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// This is a Route Handler for the endpoint POST /api/scans
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const title = formData.get('title') as string;
  const file = formData.get('file') as File;
  const userId = formData.get('user_id') as string;

  if (!title || !file || !userId) {
    return NextResponse.json({ error: 'Title, file, and user_id are required' }, { status: 400 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  try {
    // Generate content hash for deduplication
    const fileBuffer = await file.arrayBuffer();
    const contentHash = crypto.createHash('sha256').update(new Uint8Array(fileBuffer)).digest('hex');
    
    // Upload file to storage
    const filePath = `${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('scans').upload(filePath, file);
    if (uploadError) throw uploadError;

    // Create binder upload record and enqueue job using the new, correctly named stored procedure
    const { data, error: enqueueError } = await supabase.rpc('create_binder_and_enqueue_job', {
      p_user_id: userId,
      p_storage_path: filePath,
      p_content_hash: contentHash,
      p_binder_title: title
    });

    if (enqueueError) {
      // Clean up uploaded file if job creation fails
      await supabase.storage.from('scans').remove([filePath]);
      throw enqueueError;
    }

    console.log('Binder upload enqueued:', data);
    return NextResponse.json({ 
      message: 'Binder uploaded and queued for processing',
      job_id: data?.[0]?.job_id
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error in POST /api/scans:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 