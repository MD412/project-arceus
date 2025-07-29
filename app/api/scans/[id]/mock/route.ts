// TEST ENDPOINT - Mocks a completed scan for E2E testing
import { supabaseAdmin } from '@/lib/supabase/server';
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

  // Update scan_uploads to completed with mock results
  const { error: updateError } = await supabase
    .from('scan_uploads')
    .update({
      processing_status: 'completed',
      results: {
        enriched_cards: [
          {
            card_index: 0,
            card_name: 'Greavard',
            set_name: 'Scarlet & Violet',
            set_code: 'SV1',
            card_number: '095',
            enrichment_success: true,
            identification_confidence: 95.5,
            cropped_image_path: '/mock/crop_0.jpg'
          },
          {
            card_index: 1,
            card_name: 'Unknown Card',
            enrichment_success: false,
            identification_confidence: 12.3,
            cropped_image_path: '/mock/crop_1.jpg'
          }
        ],
        summary_image_path: '/mock/summary.jpg'
      }
    })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Create mock detections
  const mockDetections = [
    {
      scan_id: id,
      crop_url: `https://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scans/mock/crop_0.jpg`,
      bbox: [10, 10, 100, 150],
      confidence: 0.955,
      tile_source: 'A1' as const,
      guess_card_id: null // Would normally reference cards table
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