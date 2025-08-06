import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export interface Card {
  id: string;
  name: string;
  set_code: string;
  card_number: string;
  image_url: string | null;
  set_name: string;
  rarity: string;
  market_price: number | null;
}

interface CardSearchResponse {
  results: Card[];
  query: string;
}

// Debounced search hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Fetch function for card search
async function fetchCardSearch(query: string): Promise<CardSearchResponse> {
  if (!query || query.trim().length < 2) {
    return { results: [], query: '' };
  }

  const response = await fetch(`/api/cards/search?q=${encodeURIComponent(query.trim())}`);
  
  if (!response.ok) {
    throw new Error('Search failed');
  }

  return response.json();
}

export function useCardSearch(query: string) {
  const debouncedQuery = useDebounce(query, 50); // Super fast 50ms debounce for instant feel

  return useQuery({
    queryKey: ['cardSearch', debouncedQuery],
    queryFn: () => fetchCardSearch(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
} 