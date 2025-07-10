import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const title = formData.get('title') as string;
  const file = formData.get('file') as File;
  const userId = formData.get('user_id') as string;

  if (!title || !file || !userId) {
    return NextResponse.json({ error: 'Missing required form data' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let scanUploadId: string | null = null;
  let storagePath: string | null = null;

  try {
    const fileBuffer = await file.arrayBuffer();
    const contentHash = crypto.createHash('sha256').update(new Uint8Array(fileBuffer)).digest('hex');
    
    storagePath = `${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('scans').upload(storagePath, file);

    if (uploadError) {
      throw new Error('Storage upload failed.');
    }

    const { data: { publicUrl } } = supabase.storage.from('scans').getPublicUrl(storagePath);

    // Step 1: Create the scan record.
    const { data: scanData, error: scanError } = await supabase
      .from('scan_uploads')
      .insert({
        user_id: userId,
        scan_title: title,
        storage_path: storagePath,
        processing_status: 'pending',
        content_hash: contentHash,
        results: { image_public_url: publicUrl }
      })
      .select('id')
      .single();

    if (scanError || !scanData) {
      throw new Error('Failed to create scan record.');
    }
    
    scanUploadId = scanData.id;

    // Step 2: Create the corresponding job.
    const { error: jobError } = await supabase
      .from('job_queue')
      .insert({
        scan_upload_id: scanUploadId, // Explicitly pass the ID
        status: 'pending',
        job_type: 'process_scan_page',
        payload: { storage_path: storagePath },
      });

    if (jobError) {
      throw new Error('Failed to create job queue entry.');
    }

    return NextResponse.json({ 
      message: 'Scan uploaded and queued successfully.',
      scan_id: scanUploadId,
    }, { status: 201 });
    
  } catch (error: any) {
    // If anything fails, attempt to clean up the orphaned data.
    if (storagePath) {
      await supabase.storage.from('scans').remove([storagePath]);
    }
    if (scanUploadId) {
      await supabase.from('scan_uploads').delete().eq('id', scanUploadId);
    }
    
    console.error('Critical error in POST /api/scans:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  
  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: scans, error } = await supabase
      .from('scan_uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(scans || []);
    
  } catch (error: any) {
    console.error('Error in GET /api/scans:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}