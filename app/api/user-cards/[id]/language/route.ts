import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server';

/**
 * PATCH /api/user-cards/[id]/language
 * 
 * Updates the language/region for a user's card instance.
 * Allows users to tag cards as EN, JP, KR, etc.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseUserCtx = await supabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabaseUserCtx.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = supabaseAdmin();

  try {
    const body = await request.json();
    const { language } = body;

    // Validate language code
    const validLanguages = ['en', 'jp', 'kr', 'zh-tw', 'zh-cn', 'fr', 'de', 'it', 'es', 'pt'];
    if (!language || !validLanguages.includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language code. Must be one of: ' + validLanguages.join(', ') },
        { status: 400 }
      );
    }

    // Verify the card instance belongs to the user
    const { data: existingInstance, error: fetchError } = await supabase
      .from('user_cards')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingInstance) {
      return NextResponse.json(
        { error: 'Card instance not found' },
        { status: 404 }
      );
    }

    if (existingInstance.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update the language
    const { data: updatedInstance, error: updateError } = await supabase
      .from('user_cards')
      .update({
        language,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        card:cards(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating card language:', updateError);
      return NextResponse.json(
        { error: 'Failed to update card language' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Card language updated successfully',
      instance: updatedInstance
    });

  } catch (error) {
    console.error('Error in PATCH /api/user-cards/[id]/language:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


