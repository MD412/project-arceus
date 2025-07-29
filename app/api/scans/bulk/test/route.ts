// TEST ENDPOINT - DO NOT USE IN PRODUCTION
import { supabaseAdmin } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  const testUserId = 'e70cd309-1842-4008-bdb9-33c20eff8f00'; // Your test user ID from the logs

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  // Direct service role access - no auth needed
  const supabase = supabaseAdmin();

  const results = await Promise.allSettled(
    files.map(async (file) => {
      const scanId = uuid();
      const filePath = `${testUserId}/${scanId}.jpg`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('scans')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create scan job
      const { error: rpcError } = await supabase.rpc('enqueue_scan_job', {
        p_scan_id: scanId,
        p_user_id: testUserId,
        p_storage_path: filePath,
      });

      if (rpcError) throw rpcError;

      return { scan_id: scanId, path: filePath };
    })
  );

  const success = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<any>).value);

  return NextResponse.json({
    message: 'Test scans created',
    count: success.length,
    scans: success,
    scan_id: success[0]?.scan_id // Return first scan ID for easy testing
  }, { status: 201 });
} 