import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

function sanitizeQuery(query: string): string {
  return query
    .replace(/[%_]/g, '') // remove wildcard characters to avoid breaking ilike pattern
    .replace(/[',;]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMarketPrice(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }

  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

async function searchCardsInDB(query: string) {
  const supabase = supabaseAdmin();
  const sanitized = sanitizeQuery(query);

  if (!sanitized) {
    return [];
  }

  const likeFragment = `%${sanitized}%`;
  const orFilter = [
    `name.ilike.${likeFragment}`,
    `set_code.ilike.${likeFragment}`,
    `card_number.ilike.${likeFragment}`,
    `set_name.ilike.${likeFragment}`,
  ].join(',');

  const { data, error } = await supabase
    .from('cards')
    .select('id, name, set_code, card_number, set_name, rarity, market_price, image_urls')
    .or(orFilter)
    .order('name', { ascending: true })
    .limit(30);

  if (error) {
    console.error('? Database search error:', error);
    throw error;
  }

  return data ?? [];
}

export async function GET(request: NextRequest) {
const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  console.log('?? Card search request:', { query });

  if (!query || query.trim().length < 2) {
    console.log('?? Query too short, returning empty results');
    return NextResponse.json({ results: [] });
  }

  try {
    console.log('?? Searching database with query:', query.trim());

    const dbResults = await searchCardsInDB(query);

    const results = dbResults.map((card: any) => {
      const imageUrls = card.image_urls || null;
      const imageUrl =
        card.image_url ||
        imageUrls?.small ||
        imageUrls?.normal ||
        imageUrls?.large ||
        null;

      return {
        id: card.id,
        name: card.name,
        set_code: card.set_code || 'unknown',
        card_number: card.card_number || 'unknown',
        image_url: imageUrl,
        set_name: card.set_name || `Set ${card.set_code || 'Unknown'}`,
        rarity: card.rarity || 'Common',
        market_price: normalizeMarketPrice(card.market_price),
      };
    });

    console.log('? Database search successful, found', results.length, 'results');

    return NextResponse.json({ results, query: query.trim() });
  } catch (error) {
    console.error('? Card search error:', error);
    return NextResponse.json(
      {
        error: 'Search failed',
        details: error instanceof Error ? error.message : String(error),
        results: [],
      },
      { status: 500 }
    );
  }
}
