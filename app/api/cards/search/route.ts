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
    const normalize = (s: string) => (s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s.-]/g, '');
    const searchTerm = normalize(query.trim());

    // Tokenize and support rarity aliases like SIR → Special Illustration Rare
    const tokens = searchTerm.split(/\s+/).filter(Boolean);
    const rarityAliasMap: Record<string, string[]> = {
      sir: ['special illustration rare', 'illustration rare'],
      ir: ['illustration rare'],
      sar: ['special art rare', 'illustration rare'],
      hr: ['hyper rare'],
      ur: ['ultra rare'],
      sr: ['secret rare'],
      ar: ['art rare'],
      csr: ['character super rare'],
      chr: ['character rare'],
    };
    const aliasTokens = tokens.filter((t) => t in rarityAliasMap);
    const plainTokens = tokens.filter((t) => !(t in rarityAliasMap));

    function scoreCard(card: any): number {
      const name = normalize(card.name || '');
      const number = normalize(card.number || '');
      const rarity = normalize(card.rarity || '');
      const setCode = (card.id?.split('-')[0] || '').toLowerCase();

      // quick reject: if any plain token not found anywhere in name/number/set, skip
      for (const t of plainTokens) {
        if (!(name.includes(t) || number.includes(t) || setCode.includes(t))) return -Infinity;
      }

      // alias match bonus
      let aliasBonus = 0;
      if (aliasTokens.length > 0) {
        aliasBonus = aliasTokens.some((a) => rarityAliasMap[a].some((syn) => rarity.includes(syn))) ? 1 : -2; // penalize if alias requested but not present
      }

      let score = 0;
      for (const t of plainTokens) {
        if (!t) continue;
        // name anchoring
        if (name.startsWith(t)) score += 8; // Toed* → Toedscruel/Toedscool rank high
        else if (name.split(/\s+/).some((w) => w.startsWith(t))) score += 6;
        else if (name.includes(t)) score += 3;

        // number and set code relevance
        if (number === t) score += 6;
        else if (number.startsWith(t)) score += 4;
        if (setCode === t) score += 3;
      }

      score += aliasBonus;
      return score;
    }

    const results = cards
      .map((card: any) => ({ card, score: scoreCard(card) }))
      .filter(({ score }) => score > -Infinity)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map(({ card }) => ({
        id: card.id,
        name: card.name,
        set_code: card.id.split('-')[0] || 'unknown',
        card_number: card.number || 'unknown',
        image_url: card.images?.large || card.images?.small || null,
        set_name: `Set ${card.id.split('-')[0] || 'Unknown'}`,
        rarity: card.rarity || 'Common',
        market_price: null,
      }));

    console.log('✅ Local search successful, found', results.length, 'results');

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