import { createServerClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// PATCH /api/binders/[id] - for renaming
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const { binder_title } = await request.json();

  if (!binder_title) {
    return NextResponse.json({ error: 'New title is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('binder_page_uploads')
      .update({ binder_title })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own binders
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

// DELETE /api/binders/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    // First, get the storage_path of the binder to delete the file
    const { data: uploadData, error: fetchError } = await supabase
      .from('binder_page_uploads')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
      
    if (fetchError || !uploadData) {
        return NextResponse.json({ error: 'Binder not found or you do not have permission to delete it.' }, { status: 404 });
    }

    // Delete the file from storage
    if (uploadData.storage_path) {
        const { error: storageError } = await supabase.storage
            .from('binders')
            .remove([uploadData.storage_path]);

        if (storageError) {
            // Log the error but continue to delete the DB record
            console.error(`Could not delete file ${uploadData.storage_path} from storage:`, storageError);
        }
    }

    // Then, delete the binder record from the database
    // The CASCADE on job_queue will delete the associated job.
    const { error: deleteError } = await supabase
      .from('binder_page_uploads')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ message: 'Binder deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error in DELETE /api/binders/${id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 