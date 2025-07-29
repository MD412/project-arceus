// app/api/scans/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { v4 as uuid } from 'uuid';

// --- Helper for creating a Supabase client with user context ---
async function getSupabaseClientWithUser() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );
}

// --- Helper for creating a Supabase client with service role ---
function getSupabaseServiceRoleClient() {
    return supabaseAdmin();
    }
    
/**
 * GET /api/scans
 * Fetches all scans for the currently authenticated user.
 */
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseClientWithUser();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { data: scans, error } = await getSupabaseServiceRoleClient()
      .from('scan_uploads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(scans || []);
    
  } catch (error: any) {
    console.error('Error in GET /api/scans:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/scans (Legacy Single Upload)
 * This is now a wrapper around the same logic as the bulk endpoint for consistency.
 */
export async function POST(request: NextRequest) {
  const supabaseUserClient = await getSupabaseClientWithUser();
  const { data: { user } } = await supabaseUserClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }
  
  const supabaseService = getSupabaseServiceRoleClient();
  const scanId = uuid();
  const filePath = `${user.id}/${scanId}.${file.name.split('.').pop()}`;

  try {
    // 1. Upload raw image to storage
    const { error: uploadError } = await supabaseService.storage
      .from('scans')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Insert DB row & queue job through the stored procedure
    const { error: rpcError } = await supabaseService.rpc('enqueue_scan_job', {
      p_scan_id: scanId,
      p_user_id: user.id,
      p_storage_path: filePath,
    });

    if (rpcError) {
      // Clean up orphaned upload
      await supabaseService.storage.from('scans').remove([filePath]);
      throw rpcError;
    }

    return NextResponse.json({
        message: 'Scan queued successfully.',
        scan_id: scanId,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/scans:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}