// app/api/scans/bulk/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { v4 as uuid } from 'uuid';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * POST /api/scans/bulk
 * Accepts 1-200 JPEG/PNG images in a multipart/form-data body under the key “files”.
 * For each image:
 *  1. Stores it in the `scans` bucket at `${userId}/${uuid()}.jpg`
 *  2. Inserts a row into `scans` and `job_queue` via the RPC `enqueue_scan_job`
 */
export async function POST(request: NextRequest) {
  // -------- 1  Init Supabase client and get user
  const supabase = await supabaseServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }
  const userId = user.id;

  // -------- 2  Parse form data
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  
  if (files.length === 0) {
    return NextResponse.json(
      { error: 'At least one file is required' },
      { status: 400 },
    );
  }
  if (files.length > 200) {
    return NextResponse.json(
      { error: 'Max 200 files per request' },
      { status: 413 },
    );
  }

  // -------- 3  Upload + enqueue in parallel
  const scanPromises = files.map(async (file) => {
    const scanId = uuid();
    const filePath = `${userId}/${scanId}.jpg`;
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('scans')
      .upload(filePath, file, {
        contentType: file.type || 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error(`Upload failed for ${filePath}:`, uploadError);
      return { error: `Upload failed: ${uploadError.message}` };
    }
    
    // Enqueue job
    const { data: job, error: rpcError } = await supabase.rpc('enqueue_scan_job', {
      p_user_id: userId,
      p_scan_id: scanId,
      p_storage_path: filePath,
    });
    
    if (rpcError) {
      console.error(`🔴 RPC Error: enqueue_scan_job failed for scan_id ${scanId}:`, JSON.stringify(rpcError, null, 2));
      return { 
        error: `Failed to queue job: ${rpcError.message}`, 
        details: rpcError 
      };
    }

    return { scan_id: scanId, path: filePath };
  });
  
  const results = await Promise.all(scanPromises);
  const successfulScans = results.filter(r => !r.error);
  const failedScans = results.filter(r => r.error);

  if (failedScans.length > 0) {
    console.error('Some scans failed to process:', failedScans);
    // Return the details of the first failure for debugging
    return NextResponse.json(
      { 
        error: 'Some scans failed to process.', 
        details: failedScans[0] 
      },
      { status: 500 },
    );
  }

  if (successfulScans.length === 0) {
    return NextResponse.json(
      { error: 'All scans failed to process.', details: failedScans },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      message: `${successfulScans.length} of ${files.length} scans queued successfully.`,
      scans: successfulScans,
      failures: failedScans,
      count: successfulScans.length,
    },
    { status: 201 },
  );
}