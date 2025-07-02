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

    // Create scan record using the existing scan_uploads table
    const { data: scanUpload, error: scanError } = await supabase
      .from('scan_uploads')
      .insert({
        user_id: userId,
        scan_title: title,
        storage_path: filePath,
        processing_status: 'pending',
        content_hash: contentHash
      })
      .select('id')
      .single();

    if (scanError) {
      // Clean up uploaded file if scan creation fails
      await supabase.storage.from('scans').remove([filePath]);
      throw scanError;
    }

    // Create job queue entry directly
    const { data: job, error: jobError } = await supabase
      .from('job_queue')
      .insert({
        scan_upload_id: scanUpload.id,
        status: 'pending',
        job_type: 'process_scan_page',
        payload: { storage_path: filePath }
      })
      .select('id')
      .single();

    if (jobError) {
      console.error('Job creation failed:', jobError);
      throw jobError;
    }

    console.log('Scan uploaded and queued for processing:', { 
      scan_id: scanUpload.id, 
      job_id: job?.id 
    });
    
    return NextResponse.json({ 
      message: 'Scan uploaded and queued for processing',
      scan_id: scanUpload.id,
      job_id: job?.id
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error in POST /api/scans:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint to fetch user's scans using the new architecture
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  
  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  try {
    // Fetch scans using the existing scan_uploads table
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