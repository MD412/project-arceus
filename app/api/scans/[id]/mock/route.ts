// TEST ENDPOINT - Mocks a completed scan for E2E testing
import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { id } = params;

  const supabase = supabaseAdmin();
  const userCtx = await supabaseServer();
  const { data: userResp } = await userCtx.auth.getUser();
  const currentUserId = userResp?.user?.id;
  if (!currentUserId) {
    return NextResponse.json({ error: 'No authenticated user for mock' }, { status: 401 });
  }

  // First update the job_queue entry to completed
  const { error: jobUpdateError } = await supabase
    .from('job_queue')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('scan_upload_id', id);

  if (jobUpdateError) {
    console.log('Job update error (might not exist):', jobUpdateError);
  }

  // Upsert into scans with 'ready' status so it appears in inbox for current user
  const { error: upsertError } = await supabase
    .from('scans')
    .upsert(
      {
        id,
        user_id: currentUserId,
        title: 'Mock Scan',
        status: 'ready',
        storage_path: `mock/${id}.jpg`,
        summary_image_path: '/mock/summary.jpg',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Create mock detections
  const mockDetections = [
    {
      scan_id: id,
      crop_url: `https://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scans/mock/crop_0.jpg`,
      bbox: [10, 10, 100, 150],
      confidence: 0.955,
      tile_source: 'A1' as const,
      guess_card_id: null // keep unmapped to allow correction flow
    },
    {
      scan_id: id,
      crop_url: `https://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scans/mock/crop_1.jpg`,
      bbox: [120, 10, 100, 150],
      confidence: 0.123,
      tile_source: 'A2' as const,
      guess_card_id: null
    }
  ];

  const { error: detectionsError } = await supabase
    .from('card_detections')
    .insert(mockDetections);

  if (detectionsError) {
    console.error('Failed to create mock detections:', detectionsError);
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Scan mocked as completed',
    scan_id: id 
  });
} 