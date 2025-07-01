import { supabaseServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseServer();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scanId = params.id;
  const { cardIndex, correctedData } = await request.json();

  if (typeof cardIndex !== 'number' || !correctedData) {
    return NextResponse.json(
      { error: 'Invalid request body: cardIndex and correctedData are required.' },
      { status: 400 }
    );
  }

  // Call the Supabase RPC function to update the card.
  const { error } = await supabase.rpc('update_scan_card_correction', {
    p_job_id: scanId,
    p_card_index: cardIndex,
    p_corrected_data: correctedData,
  });

  if (error) {
    console.error('Supabase RPC error:', error);
    return NextResponse.json(
      { error: 'Failed to update card correction.', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Correction saved successfully.',
  });
} 