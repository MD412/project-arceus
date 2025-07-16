-- Create RPC function for CLIP-based card similarity search
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
        COALESCE(c.name, 'Unknown Card') as name,
        COALESCE(c.set_code, '') as set_code,
        COALESCE(c.card_number, '') as card_number,
        COALESCE(c.image_url, '') as image_url,
        COALESCE(c.rarity, '') as rarity,
        (ce.embedding <=> query_embedding) as distance
    FROM card_embeddings ce
    LEFT JOIN cards c ON (c.set_code = split_part(ce.card_id, '-', 1) AND c.card_number = split_part(ce.card_id, '-', 2))
    WHERE (1.0 - (ce.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY ce.embedding <=> query_embedding
    LIMIT max_results;
END;
$$; 