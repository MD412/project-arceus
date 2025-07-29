import { supabaseAdmin } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = supabaseAdmin();

  const SCAN_ID = '66a46556-2446-4bc9-aa1c-c3b706ab6457';

  try {
    // Check scan_uploads table
    const { data: scan, error: scanError } = await supabase
      .from('scan_uploads')
      .select('*')
      .eq('id', SCAN_ID)
      .single();

    // Check job_queue
    const { data: job, error: jobError } = await supabase
      .from('job_queue')
      .select('*')
      .eq('scan_upload_id', SCAN_ID)
      .single();

    // Check card_detections - try both IDs
    const { data: detections, error: detectionsError } = await supabase
      .from('card_detections')
      .select('*, card:guess_card_id(*)')
      .eq('scan_id', SCAN_ID);

    // Also check with the actual scan_id from results
    const actualScanId = scan?.results?.scan_id;
    let actualDetections = null;
    if (actualScanId && actualScanId !== SCAN_ID) {
      const { data: altDetections } = await supabase
        .from('card_detections')
        .select('*, card:guess_card_id(*)')
        .eq('scan_id', actualScanId);
      actualDetections = altDetections;
    }

    return NextResponse.json({
      scan_id: SCAN_ID,
      scan_uploads: {
        found: !!scan,
        data: scan,
        error: scanError
      },
      job_queue: {
        found: !!job,
        data: job,
        error: jobError
      },
      card_detections: {
        count: detections?.length || 0,
        data: detections,
        error: detectionsError
      },
      actual_scan_id: actualScanId,
      actual_detections: {
        count: actualDetections?.length || 0,
        data: actualDetections
      }
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 