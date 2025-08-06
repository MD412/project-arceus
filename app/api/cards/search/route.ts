import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache for card data
let cardCache: any[] = [];
let cacheLoaded = false;

async function loadCardData() {
  if (cacheLoaded) return cardCache;
  
  const cardsDir = path.join(process.cwd(), 'pokemon-tcg-data', 'cards', 'en');
  const files = fs.readdirSync(cardsDir).filter(f => f.endsWith('.json'));
  
  const allCards: any[] = [];
  
  // Load all files to ensure we have complete coverage
  for (const file of files) {
    const filePath = path.join(cardsDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    allCards.push(...data);
  }
  
  cardCache = allCards;
  cacheLoaded = true;
  console.log(`📚 Loaded ${allCards.length} cards from local data`);
  return allCards;
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
    console.log('🔗 Searching local card data with query:', query.trim());
    
    const cards = await loadCardData();
    const searchTerm = query.trim().toLowerCase();
    
    // Fast local search
    const results = cards
      .filter((card: any) => 
        card.name?.toLowerCase().includes(searchTerm) ||
        card.number?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 10) // Limit to 10 results
      .map((card: any) => ({
        id: card.id,
        name: card.name,
        set_code: card.id.split('-')[0] || 'unknown', // Extract set code from card ID
        card_number: card.number || 'unknown',
        image_url: card.images?.large || card.images?.small || null,
        set_name: `Set ${card.id.split('-')[0] || 'Unknown'}`, // Use set code as set name
        rarity: card.rarity || 'Common',
        market_price: null // No price data in local files
      }));

    console.log('✅ Local search successful, found', results.length, 'results');

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