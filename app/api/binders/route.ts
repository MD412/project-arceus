import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

// This is a Route Handler for the endpoint POST /api/binders
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const title = formData.get('title') as string;
  const file = formData.get('file') as File;

  if (!title || !file) {
    return new NextResponse(JSON.stringify({ error: 'Title and file are required' }), { status: 400 });
  }

  // Create a Supabase client with the service_role key to bypass RLS.
  // This is safe because this code only runs on the server.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Step 1: Upload the image file to Supabase Storage.
    const fileName = `public/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('binders')
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    // Step 2: Create the corresponding job record in the database.
    const { error: jobError } = await supabaseAdmin.from('jobs').insert({
      binder_title: title,
      input_image_path: uploadData.path,
    });

    if (jobError) {
      // If the job creation fails, we should try to clean up the uploaded file.
      await supabaseAdmin.storage.from('binders').remove([fileName]);
      throw jobError;
    }

    // Step 3: Return a success response.
    return new NextResponse(JSON.stringify({ message: 'Binder created successfully' }), {
      status: 201, // 201 Created is more appropriate here
    });
  } catch (error: any) {
    console.error('Error in POST /api/binders:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
} 