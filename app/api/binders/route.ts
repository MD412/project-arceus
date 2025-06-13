import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

// This is a Route Handler for the endpoint POST /api/binders
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const title = formData.get('title') as string;
  const file = formData.get('file') as File;
  const userId = formData.get('user_id') as string;

  if (!title || !file || !userId) {
    return NextResponse.json({ error: 'Title, file, and user_id are required' }, { status: 400 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  try {
    const filePath = `${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('binders').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { error: jobError } = await supabase.from('jobs').insert({ user_id: userId, binder_title: title, input_image_path: filePath });
    if (jobError) {
      await supabase.storage.from('binders').remove([filePath]);
      throw jobError;
    }

    return NextResponse.json({ message: 'Binder created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/binders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 