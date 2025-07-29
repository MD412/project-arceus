import { supabaseAdmin } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

// POST /api/collections - Add cards to user's collection
export async function POST(request: NextRequest) {
  const supabase = supabaseAdmin();

  try {
    const { userId, cards } = await request.json();

    if (!userId || !cards || !Array.isArray(cards)) {
      return NextResponse.json({ error: 'userId and cards array are required' }, { status: 400 });
    }

    const results = [];

    for (const cardData of cards) {
      const { cardId, condition = 'unknown', quantity = 1, cropImageUrl } = cardData;

      if (!cardId) {
        results.push({ error: 'Missing cardId', cardData });
        continue;
      }

      // Check if user already has this card
      const { data: existingCard } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', userId)
        .eq('card_id', cardId)
        .single();

      if (existingCard) {
        // Update quantity if card already exists
        const { data: updatedCard, error } = await supabase
          .from('user_cards')
          .update({ 
            quantity: existingCard.quantity + quantity,
            condition: condition !== 'unknown' ? condition : existingCard.condition 
          })
          .eq('id', existingCard.id)
          .select('*')
          .single();

        if (error) {
          results.push({ error: error.message, cardData });
        } else {
          results.push({ 
            action: 'updated', 
            card: updatedCard, 
            previousQuantity: existingCard.quantity 
          });
        }
      } else {
        // Create new card entry
        const { data: newCard, error } = await supabase
          .from('user_cards')
          .insert({
            user_id: userId,
            card_id: cardId,
            quantity,
            condition,
            image_url: cropImageUrl
          })
          .select('*')
          .single();

        if (error) {
          results.push({ error: error.message, cardData });
        } else {
          results.push({ action: 'created', card: newCard });
        }
      }
    }

    const successful = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;

    return NextResponse.json({
      message: `Successfully processed ${successful} cards${failed ? `, ${failed} failed` : ''}`,
      results,
      summary: { successful, failed, total: cards.length }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/collections:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/collections - Get user's collection
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  
  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  try {
    const { data: userCards, error } = await supabase
      .from('user_cards')
      .select(`
        *,
        cards:card_id (
          id,
          name,
          set_code,
          card_number,
          image_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate collection stats
    const totalCards = userCards?.length || 0;
    const totalValue = userCards?.reduce((sum, card) => {
      // You could store estimated_value in user_cards or calculate it
      return sum + (card.quantity * 10); // Placeholder value calculation
    }, 0) || 0;

    const uniqueSets = new Set(userCards?.map(card => (card.cards as any)?.set_code).filter(Boolean));

    return NextResponse.json({
      cards: userCards,
      stats: {
        totalCards,
        totalValue,
        uniqueSets: uniqueSets.size
      }
    });

  } catch (error: any) {
    console.error('Error in GET /api/collections:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 