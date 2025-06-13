import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

// This is a Route Handler for the endpoint DELETE /api/binders/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const binderId = params.id;

  // Create a Supabase client with the service_role key to bypass RLS.
  // This is safe because this code only runs on the server.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Step 1: Fetch the job record to get the paths of the files to delete.
    const { data: job, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('input_image_path, results')
      .eq('id', binderId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return new NextResponse(JSON.stringify({ error: 'Binder not found' }), { status: 404 });
      }
      throw fetchError;
    }

    // Step 2: Build an array of file paths to delete from storage.
    const pathsToDelete: string[] = [];
    if (job.input_image_path) {
      pathsToDelete.push(job.input_image_path);
    }
    if (job.results?.summary_image_path) {
      pathsToDelete.push(job.results.summary_image_path);
    }

    // Step 3: Delete the files from storage.
    if (pathsToDelete.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('binders')
        .remove(pathsToDelete);
      
      if (storageError) {
        // Log the error but proceed to delete the DB record anyway
        console.error(`Error deleting storage for job ${binderId}:`, storageError);
      }
    }

    // Step 4: Delete the binder (job) record from the database.
    const { error: deleteError } = await supabaseAdmin
      .from('jobs')
      .delete()
      .eq('id', binderId);

    if (deleteError) {
      throw deleteError;
    }

    // Step 5: Return a success response.
    return new NextResponse(JSON.stringify({ message: 'Binder deleted successfully' }), {
      status: 200,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/binders/[id]:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

// This is a Route Handler for the endpoint PATCH /api/binders/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const binderId = params.id;
  const body = await request.json();
  const newTitle = body.binder_title;

  if (!newTitle) {
    return new NextResponse(JSON.stringify({ error: 'New title is required' }), { status: 400 });
  }

  // Create a Supabase client with the service_role key to bypass RLS.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { error } = await supabaseAdmin
      .from('jobs')
      .update({ binder_title: newTitle })
      .eq('id', binderId);

    if (error) {
      throw error;
    }

    return new NextResponse(JSON.stringify({ message: 'Binder renamed successfully' }), {
      status: 200,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/binders/[id]:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
} 