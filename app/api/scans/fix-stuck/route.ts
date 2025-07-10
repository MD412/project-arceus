import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  
  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find stuck scans (queued or processing for more than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: stuckScans, error: fetchError } = await supabase
      .from('scan_uploads')
      .select('id, scan_title, processing_status')
      .eq('user_id', user.id)
      .in('processing_status', ['queued', 'processing'])
      .lt('created_at', fiveMinutesAgo);

    if (fetchError) {
      throw fetchError;
    }

    if (!stuckScans || stuckScans.length === 0) {
      return NextResponse.json({ 
        message: 'No stuck scans found',
        fixed: 0 
      });
    }

    console.log(`🔧 Found ${stuckScans.length} stuck scans to fix`);

    let fixedCount = 0;
    const errors = [];

    for (const scan of stuckScans) {
      try {
        // Reset scan to queued status
        const { error: updateError } = await supabase
          .from('scan_uploads')
          .update({ 
            processing_status: 'queued',
            error_message: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', scan.id)
          .eq('user_id', user.id);

        if (updateError) {
          errors.push(`Failed to reset ${scan.scan_title}: ${updateError.message}`);
        } else {
          // Also reset any stuck jobs
          const { error: jobError } = await supabase
            .from('job_queue')
            .update({
              status: 'pending',
              started_at: null,
              finished_at: null
            })
            .eq('scan_upload_id', scan.id)
            .in('status', ['processing']);

          if (jobError) {
            console.error(`Job reset error for ${scan.id}:`, jobError);
          }

          fixedCount++;
          console.log(`✅ Reset: ${scan.scan_title}`);
        }

      } catch (error) {
        console.error(`Error fixing scan ${scan.id}:`, error);
        errors.push(`Failed to fix ${scan.scan_title}: ${error}`);
      }
    }

    return NextResponse.json({
      message: `Fixed ${fixedCount} stuck scans`,
      fixed: fixedCount,
      total_found: stuckScans.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Fix stuck scans error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 