import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

// POST /api/collections - Add cards to user's collection
export async function POST(request: NextRequest) {
  const adminClient = supabaseAdmin();
  const supabaseUserCtx = await supabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabaseUserCtx.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { userId: bodyUserId, cards } = await request.json();

    if (bodyUserId && bodyUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!cards || !Array.isArray(cards)) {
      return NextResponse.json({ error: 'cards array is required' }, { status: 400 });
    }

    const results = [];

    for (const cardData of cards) {
      const { cardId, condition = 'unknown', quantity = 1, cropImageUrl } = cardData || {};

      if (!cardId) {
        results.push({ error: 'Missing cardId', cardData });
        continue;
      }

      // Check if user already has this card
      const { data: existingCard } = await adminClient
        .from('user_cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('card_id', cardId)
        .single();

      if (existingCard) {
        // Update quantity if card already exists
        const { data: updatedCard, error } = await adminClient
          .from('user_cards')
          .update({
            quantity: existingCard.quantity + quantity,
            condition: condition !== 'unknown' ? condition : existingCard.condition,
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
            previousQuantity: existingCard.quantity,
          });
        }
      } else {
        // Create new card entry
        const { data: newCard, error } = await adminClient
          .from('user_cards')
          .insert({
            user_id: user.id,
            card_id: cardId,
            quantity,
            condition,
            image_url: cropImageUrl,
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

    const successful = results.filter((r) => !r.error).length;
    const failed = results.filter((r) => r.error).length;
    const total = cards.length || 0;

    return NextResponse.json(
      {
        message: `Successfully processed ${successful} cards${failed ? `, ${failed} failed` : ''}`,
        results,
        summary: { successful, failed, total },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Error in POST /api/collections:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/collections - Get user's collection
export async function GET(request: NextRequest) {
  const supabaseUserCtx = await supabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabaseUserCtx.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get('user_id');

  if (requestedUserId && requestedUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = supabaseAdmin();

  try {
    const { data: userCards, error } = await supabase
      .from('user_cards')
      .select(
        `
        *,
        cards:card_id (
          id,
          name,
          set_code,
          set_name,
          card_number,
          image_urls
        ),
        detection:detection_id (
          id,
          crop_url
        )
      `,
      )
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (error) throw error;

    // Normalize for client: flatten and compute image_url from image_urls.small
    const normalized = (userCards || []).map((uc: any) => {
      const relCrop = uc.detection?.crop_url || null;
      const rawCropUrl = relCrop
        ? String(relCrop).startsWith('http')
          ? relCrop
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scans/${relCrop}`
        : null;

      return {
        id: uc.id,
        quantity: uc.quantity ?? 1,
        condition: uc.condition ?? 'unknown',
        language: uc.language ?? 'en',
        created_at: uc.date_added || uc.updated_at || null,
        raw_crop_url: rawCropUrl,
        card: {
          id: uc.cards?.id,
          name: uc.cards?.name,
          set_code: uc.cards?.set_code,
          set_name: uc.cards?.set_name,
          card_number: uc.cards?.card_number,
          image_url: uc.cards?.image_urls?.small || null,
        },
      };
    });

    // Calculate collection stats
    const totalCards = normalized.length;
    const totalValue = normalized.reduce((sum: number, uc: any) => {
      // You could store estimated_value in user_cards or calculate it
      return sum + uc.quantity * 10; // Placeholder value calculation
    }, 0);

    const uniqueSets = new Set(normalized.map((uc: any) => uc.card?.set_code).filter(Boolean));

    return NextResponse.json({
      cards: normalized,
      stats: {
        totalCards,
        totalValue,
        uniqueSets: uniqueSets.size,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/collections:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
