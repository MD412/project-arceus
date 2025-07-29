import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  console.log('🔍 Card search request:', { query });

  // Return empty results for short queries
  if (!query || query.trim().length < 2) {
    console.log('📝 Query too short, returning empty results');
    return NextResponse.json({ results: [] });
  }

  // Pokemon TCG API key is optional
  const apiKey = process.env.POKEMON_TCG_API_KEY;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'project-arceus/1.0'
  };
  
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }

  try {
    console.log('🔗 Calling Pokemon TCG API with query:', query.trim());
    
    // Build the query URL - Pokemon TCG API expects "name:term" format for name search
    const searchQuery = `name:${query.trim()}*`; // Add wildcard for partial matches
    const apiUrl = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(searchQuery)}&pageSize=10&orderBy=name`;
    console.log('📍 API URL:', apiUrl);
    
    // Call Pokemon TCG API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      console.error('❌ Pokemon TCG API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error body:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const cards = data.data || [];

    // Transform to our expected format
    const results = cards.map((card: any) => ({
      id: card.id,
      name: card.name,
      set_code: card.set?.id || 'unknown',
      card_number: card.number || 'unknown',
      image_url: card.images?.large || card.images?.small || null,
      set_name: card.set?.name || 'Unknown Set',
      rarity: card.rarity || 'Common',
      market_price: card.cardmarket?.prices?.averageSellPrice || null
    }));

    console.log('✅ Search successful, found', results.length, 'results');

    return NextResponse.json({ 
      results,
      query: query.trim()
    });
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