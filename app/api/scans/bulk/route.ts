// app/api/scans/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { v4 as uuid } from 'uuid'

// --- helper --------------------------------------------------------------
function getSupabaseClient() {
  // cookies() is synchronous in route handlers (no await!)
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Route-handlers **can** mutate cookies
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set({ name, value, ...options })
          )
        },
      },
    },
  )
}
// ------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient()

  // 1 Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  // 2 Grab files from multipart form
  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  if (!files.length)
    return NextResponse.json({ error: 'No files' }, { status: 400 })

  // 3 Process each file by creating a job
  const jobs = files.map(async (file) => {
    const scanUploadId = uuid();
    const storagePath = `${user.id}/${scanUploadId}.${file.name.split('.').pop()}`;

    // Step A: Upload the file to Supabase Storage.
    const { error: uploadError } = await supabase.storage
      .from('scans')
      .upload(storagePath, file);

    if (uploadError) {
        console.error('Error during storage upload:', uploadError);
        // We throw the error to be caught by the outer try/catch block
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
    }

    // Step B: Create the scan upload record in the database.
    const { error: scanError } = await supabase
      .from('scan_uploads')
      .insert({
        id: scanUploadId,
        user_id: user.id,
        storage_path: storagePath,
        scan_title: file.name,
        processing_status: 'queued',
      });
    
    if (scanError) {
        console.error('Error inserting into scan_uploads:', scanError);
        throw new Error(`Failed to create scan record for ${file.name}: ${scanError.message}`);
    }

    // Step C: Create the job queue record.
    const { error: jobError } = await supabase
      .from('job_queue')
      .insert({
        scan_upload_id: scanUploadId,
        status: 'pending',
        job_type: 'process_scan_page',
        payload: { storage_path: storagePath },
      });

    if (jobError) {
      console.error('Error inserting into job_queue:', jobError);
      throw new Error(`Failed to enqueue job for ${file.name}: ${jobError.message}`);
    }

    return { scanUploadId, storagePath };
  });

  try {
    const results = await Promise.all(jobs);
    return NextResponse.json({
        ok: true,
        message: `${results.length} scans queued successfully.`,
        count: results.length
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error("Error processing bulk upload:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 