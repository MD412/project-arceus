// TEST ENDPOINT - DO NOT USE IN PRODUCTION
import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';

const isTestRouteEnabled = process.env.ENABLE_BULK_TEST_ROUTE === 'true';

export async function POST(request: NextRequest) {
  if (!isTestRouteEnabled) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const supabaseUserCtx = await supabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabaseUserCtx.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const results = await Promise.allSettled(
    files.map(async (file) => {
      const scanId = uuid();
      const fileExt = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
      const filePath = `${user.id}/${scanId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('scans').upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: rpcError } = await supabase.rpc('enqueue_scan_job', {
        p_scan_id: scanId,
        p_user_id: user.id,
        p_storage_path: filePath,
      });

      if (rpcError) throw rpcError;

      return { scan_id: scanId, path: filePath };
    }),
  );

  const success = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<any>).value);

  if (success.length === 0) {
    return NextResponse.json({ error: 'All uploads failed' }, { status: 500 });
  }

  return NextResponse.json(
    {
      message: 'Test scans created',
      count: success.length,
      scans: success,
      scan_id: success[0]?.scan_id,
    },
    { status: 201 },
  );
}
