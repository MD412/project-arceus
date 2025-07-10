// app/api/scans/bulk/route.ts
import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';

/**
 * POST /api/scans/bulk
 * Accepts 1-200 JPEG/PNG images in a multipart/form-data body under the key “files”.
 * For each image:
 *  1. Stores it in the `scan_uploads` bucket at `${userId}/${uuid()}.jpg`
 *  2. Inserts a row into `scans` and `job_queue` via the RPC `enqueue_scan_job`
 */
export async function POST(request: NextRequest) {
  // -------- 1  Parse form data
  const formData = await request.formData();
  const files  = formData.getAll('files') as File[];
  const userId = formData.get('user_id') as string;

  if (!userId || files.length === 0) {
    return NextResponse.json(
      { error: 'user_id and at least one file are required' },
      { status: 400 },
    );
  }
  if (files.length > 200) {
    return NextResponse.json(
      { error: 'Max 200 files per request' },
      { status: 413 },
    );
  }

  // -------- 2  Init Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // -------- 3  Upload + enqueue in parallel
  const results = await Promise.allSettled(
    files.map(async (file) => {
      const scanId   = uuid();
      const filePath = `${userId}/${scanId}.jpg`;

      // 3a  Upload raw image to storage
      const { error: uploadError } = await supabase
        .storage
        .from('scans')
        .upload(filePath, file, {
          contentType: file.type,
        });
      if (uploadError) throw uploadError;

      // 3b  Insert DB row & queue job through a stored procedure
      const { error: rpcError } = await supabase.rpc('enqueue_scan_job', {
        p_scan_id:       scanId,
        p_user_id:       userId,
        p_storage_path:  filePath,
      });
      if (rpcError) {
        // Clean up orphaned upload
        await supabase.storage.from('scans').remove([filePath]);
        throw rpcError;
      }

      return { scan_id: scanId, path: filePath };
    }),
  );

  // -------- 4  Aggregate errors
  const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
  if (failed.length) {
    console.error('Bulk scan upload failures:', failed.map((f) => f.reason));
    return NextResponse.json(
      { error: `Failed to process ${failed.length} of ${files.length} files` },
      { status: 500 },
    );
  }

  const success = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<any>).value);

  return NextResponse.json(
    { message: 'Scans queued', count: success.length, scans: success },
    { status: 201 },
  );
} 