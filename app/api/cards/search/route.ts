import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

async function searchCardsInDB(query: string) {
  const supabase = await supabaseServer();
  
  // Use the database RPC function for card search
  const { data, error } = await supabase
    .rpc('search_cards', { search_term: query })
    .limit(30);
  
  if (error) {
    console.error('❌ Database search error:', error);
    throw error;
  }
  
  return data || [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  console.log('🔍 Card search request:', { query });

  // Return empty results for short queries
  if (!query || query.trim().length < 2) {
    console.log('📝 Query too short, returning empty results');
    return NextResponse.json({ results: [] });
  }

  try {
    console.log('🔗 Searching database with query:', query.trim());

    const dbResults = await searchCardsInDB(query.trim());
    
    // Transform database results to match expected frontend format
    const results = dbResults.map((card: any) => ({
      id: card.id,
      name: card.name,
      set_code: card.set_code || 'unknown',
      card_number: card.card_number || 'unknown',
      image_url: card.image_url || null,
      set_name: card.set_name || `Set ${card.set_code || 'Unknown'}`,
      rarity: card.rarity || 'Common',
      market_price: card.market_price || null,
    }));

    console.log('✅ Database search successful, found', results.length, 'results');

    return NextResponse.json({ results, query: query.trim() });
  } catch (error) {
    console.error('❌ Card search error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed', 
        details: error instanceof Error ? error.message : String(error),
        results: [] 
      }, 
      { status: 500 }
    );
  }
} 