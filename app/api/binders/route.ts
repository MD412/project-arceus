import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// This is a Route Handler for the endpoint POST /api/binders
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
    const { error: uploadError } = await supabase.storage.from('binders').upload(filePath, file);
    if (uploadError) throw uploadError;

    // Create binder upload record and enqueue job using the stored procedure
    const { data, error: enqueueError } = await supabase.rpc('enqueue_binder_upload', {
      p_user_id: userId,
      p_storage_path: filePath,
      p_content_hash: contentHash
    });

    if (enqueueError) {
      // Clean up uploaded file if job creation fails
      await supabase.storage.from('binders').remove([filePath]);
      throw enqueueError;
    }

    console.log('Binder upload enqueued:', data);
    return NextResponse.json({ 
      message: 'Binder uploaded and queued for processing',
      upload_id: data?.upload_id,
      job_id: data?.job_id
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error in POST /api/binders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 