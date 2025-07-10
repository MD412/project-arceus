import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();

    console.log('🧹 Starting cleanup of old failed scans...');

    // Get all failed scans with old worker errors
    const { data: failedScans, error: fetchError } = await supabase
      .from('scan_uploads')
      .select('id, scan_title, error_message')
      .eq('processing_status', 'failed');

    if (fetchError) {
      console.error('Failed to fetch failed scans:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch failed scans' }, { status: 500 });
    }

    if (!failedScans || failedScans.length === 0) {
      return NextResponse.json({ 
        message: 'No old failed scans to clean up',
        deleted: 0 
      });
    }

    console.log(`🗑️ Found ${failedScans.length} old failed scans to delete`);

    let deletedCount = 0;
    let errors = [];

    // Delete each failed scan
    for (const scan of failedScans) {
      try {
        console.log(`Deleting scan: ${scan.scan_title} (${scan.id})`);

        // Delete job queue entries first
        const { error: jobQueueError } = await supabase
          .from('job_queue')
          .delete()
          .eq('scan_upload_id', scan.id);

        if (jobQueueError) {
          console.error(`Job queue delete error for ${scan.id}:`, jobQueueError);
        }

        // Delete the scan upload
        const { error: scanError } = await supabase
          .from('scan_uploads')
          .delete()
          .eq('id', scan.id);

        if (scanError) {
          console.error(`Scan delete error for ${scan.id}:`, scanError);
          errors.push(`Failed to delete ${scan.scan_title}: ${scanError.message}`);
        } else {
          deletedCount++;
          console.log(`✅ Deleted: ${scan.scan_title}`);
        }

      } catch (error) {
        console.error(`Error deleting scan ${scan.id}:`, error);
        errors.push(`Failed to delete ${scan.scan_title}: ${error}`);
      }
    }

    console.log(`🧹 Cleanup complete: ${deletedCount} scans deleted`);

    return NextResponse.json({
      message: `Cleanup complete: ${deletedCount} old failed scans deleted`,
      deleted: deletedCount,
      total_found: failedScans.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Cleanup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during cleanup' },
      { status: 500 }
    );
  }
} 