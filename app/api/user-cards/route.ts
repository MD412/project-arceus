import { supabaseAdmin } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Use admin client to bypass RLS
    const supabase = supabaseAdmin();
    
    // Get the request body
    const body = await request.json();
    const { user_id, card_id, detection_id, condition, quantity } = body;
    
    // Insert the user card using service role to bypass RLS
    const { data, error } = await supabase
      .from('user_cards')
      .insert({
        user_id,
        card_id,
        detection_id,
        condition: condition || 'unknown',
        quantity: quantity || 1
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 