-- Update search_similar_cards function to use embeddings table directly
-- This eliminates the problematic JOIN and uses embedded metadata
DROP FUNCTION IF EXISTS search_similar_cards(vector(512), float, int);

CREATE OR REPLACE FUNCTION search_similar_cards(
    query_embedding vector(512),
    similarity_threshold float DEFAULT 0.85,
    max_results int DEFAULT 5
)
RETURNS TABLE (
    card_id text,
    name text,
    set_code text,
    card_number text,
    image_url text,
    rarity text,
    distance float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.card_id,
        COALESCE(ce.name, 'Unknown Card') as name,
        COALESCE(ce.set_code, '') as set_code,
        COALESCE(ce.card_number, '') as card_number,
        COALESCE(ce.image_url, '') as image_url,
        COALESCE(ce.rarity, '') as rarity,
        (ce.embedding <=> query_embedding) as distance
    FROM card_embeddings ce
    WHERE (1.0 - (ce.embedding <=> query_embedding)) >= similarity_threshold
      AND ce.image_url IS NOT NULL
      AND ce.image_url != ''
    ORDER BY ce.embedding <=> query_embedding
    LIMIT max_results;
END;
$$;