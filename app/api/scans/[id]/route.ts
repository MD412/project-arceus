import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

// PATCH /api/scans/[id] - for renaming
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // Get user_id from request headers (set by frontend)
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - User ID required' }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { id } = params;
  const { binder_title } = await request.json();

  if (!binder_title) {
    return NextResponse.json({ error: 'New title is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('scan_uploads')
      .update({ binder_title })
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only update their own binders
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Binder not found or you do not have permission to update it' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Binder renamed successfully', binder: data }, { status: 200 });
  } catch (error: any) {
    console.error(`Error in PATCH /api/binders/${id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/scans/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Get user_id from request headers (set by frontend)
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - User ID required' }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { id } = params;

  try {
    console.log(`🗑️ DELETE request for binder: ${id}, user: ${userId}`);
    
    // First, get the storage_path of the binder to delete the file
    const { data: uploadData, error: fetchError } = await supabase
      .from('scan_uploads')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
      
    if (fetchError) {
      console.error('Fetch error:', fetchError);
        return NextResponse.json({ error: 'Binder not found or you do not have permission to delete it.' }, { status: 404 });
    }
    
    if (!uploadData) {
      console.log('No upload data found');
      return NextResponse.json({ error: 'Binder not found or you do not have permission to delete it.' }, { status: 404 });
    }

    console.log(`📁 Found storage path: ${uploadData.storage_path}`);

    // Delete the file from storage
    if (uploadData.storage_path) {
        console.log(`🗂️ Deleting storage file: ${uploadData.storage_path}`);
        const { error: storageError } = await supabase.storage
            .from('scans')
            .remove([uploadData.storage_path]);

        if (storageError) {
            // Log the error but continue to delete the DB record
            console.error(`Could not delete file ${uploadData.storage_path} from storage:`, storageError);
        } else {
            console.log(`✅ Storage file deleted successfully`);
        }
    }

    // Then, delete the binder record from the database
    // The CASCADE on job_queue will delete the associated job.
    console.log(`🗄️ Deleting database record: ${id}`);
    const { error: deleteError } = await supabase
      .from('scan_uploads')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      throw deleteError;
    }

    console.log(`✅ Binder ${id} deleted successfully`);
    return NextResponse.json({ message: 'Binder deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`💥 Error in DELETE /api/binders/${id}:`, error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 