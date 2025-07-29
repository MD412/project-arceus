import { supabaseAdmin } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 Approve scan request for scan ID:', id);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
      return NextResponse.json(
        { error: 'Configuration error' }, 
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Configuration error' }, 
        { status: 500 }
      );
    }

    const supabase = supabaseAdmin();

    // 1. Get the scan details and enriched cards
    const { data: scan, error: scanError } = await supabase
      .from('scan_uploads')
      .select(`
        id,
        user_id,
        results
      `)
      .eq('id', id)
      .single();

    if (scanError || !scan) {
      console.error('❌ Error fetching scan:', scanError);
      return NextResponse.json(
        { error: 'Scan not found' }, 
        { status: 404 }
      );
    }

    console.log('✅ Found scan for user:', scan.user_id);

    // 2. The results are stored in scan_uploads, not job_queue
    const enrichedCards = scan.results?.enriched_cards || [];
    console.log('📊 Found', enrichedCards.length, 'enriched cards');

    // 3. Filter cards that are successfully identified
    const approvedCards = enrichedCards.filter((card: any) => 
      card.enrichment_success === true && 
      card.card_id && 
      card.card_name
    );

    console.log('✅ Found', approvedCards.length, 'cards to approve');

    if (approvedCards.length === 0) {
      return NextResponse.json({
        message: 'No cards to approve',
        approvedCount: 0
      });
    }

    // 4. Create user_cards entries
    const userCardsToInsert = approvedCards.map((card: any) => ({
      user_id: scan.user_id,
      card_id: card.card_id,
      detection_id: card.detection_id,
      condition: 'unknown',
      quantity: 1,
      notes: `Added from scan ${id}`
    }));

    console.log('📝 Inserting', userCardsToInsert.length, 'user_cards entries');

    const { data: insertedCards, error: insertError } = await supabase
      .from('user_cards')
      .insert(userCardsToInsert)
      .select();

    if (insertError) {
      console.error('❌ Error inserting user_cards:', insertError);
      return NextResponse.json(
        { error: 'Failed to add cards to collection' }, 
        { status: 500 }
      );
    }

    console.log('✅ Successfully added', insertedCards?.length || 0, 'cards to collection');

    // 5. Update scan status to indicate approval
    const { error: updateError } = await supabase
      .from('scan_uploads')
      .update({ 
        processing_status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('⚠️ Warning: Failed to update scan status:', updateError);
      // Don't fail the whole operation for this
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${insertedCards?.length || 0} cards to your collection`,
      approvedCount: insertedCards?.length || 0,
      totalCards: enrichedCards.length
    });

  } catch (error) {
    console.error('❌ Unexpected error in approve scan:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 