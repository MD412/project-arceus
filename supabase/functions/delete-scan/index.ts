// Delete Scan Edge Function
// Trigger: invoked when a DELETE_SCAN command is inserted into command_queue
// Runtime: Supabase Edge (Deno)

// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request): Promise<Response> => {
  try {
    const command = await req.json();

    if (command.type !== 'DELETE_SCAN') {
      return new Response('Not a DELETE_SCAN event', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { scanId, userId } = command.payload as { scanId: string; userId: string };
    const commandId = command.id as string;

    // 1. Fetch storage path (might already be null)
    const { data: scan, error: fetchErr } = await supabase
      .from('scan_uploads')
      .select('storage_path')
      .eq('id', scanId)
      .maybeSingle();

    if (fetchErr) {
      console.error('Failed to fetch scan for delete_scan:', fetchErr);
    }

    // 2. Delete file from storage if path exists
    if (scan?.storage_path) {
      const { error: storageErr } = await supabase.storage
        .from('scans')
        .remove([scan.storage_path]);
      if (storageErr) {
        console.error(`Failed to remove storage file ${scan.storage_path}:`, storageErr);
      }
    }

    // 3. Delete related job_queue rows
    const { error: qErr } = await supabase
      .from('job_queue')
      .delete()
      .eq('scan_upload_id', scanId);
    if (qErr) console.error('Failed to delete job_queue rows:', qErr);

    // 4. Hard delete scan_uploads row
    const { error: delErr } = await supabase
      .from('scan_uploads')
      .delete()
      .eq('id', scanId);
    if (delErr) console.error('Failed to hard-delete scan_uploads row:', delErr);

    // 5. Mark command processed
    const { error: processedErr } = await supabase
      .from('command_queue')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', commandId);
    if (processedErr) console.error('Failed to mark command processed:', processedErr);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Unhandled error in delete-scan function:', err);
    return new Response(JSON.stringify({ error: 'Internal edge function error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}); 