-- Create RPC function for card search
-- This enables fast card name searching for the review flow

CREATE OR REPLACE FUNCTION search_cards(search_term TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  set_code TEXT,
  card_number TEXT,
  image_urls JSONB
) AS $$
BEGIN
  -- Return empty if search term is null or too short
  IF search_term IS NULL OR length(trim(search_term)) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    c.id, 
    c.name, 
    c.set_code, 
    c.card_number, 
    c.image_url
  FROM cards c
  WHERE c.name ILIKE '%' || trim(search_term) || '%'
     OR c.set_code ILIKE '%' || trim(search_term) || '%'
     OR c.card_number ILIKE '%' || trim(search_term) || '%'
  ORDER BY 
    -- Prioritize exact matches first
    CASE WHEN c.name ILIKE trim(search_term) || '%' THEN 1
         WHEN c.name ILIKE '%' || trim(search_term) || '%' THEN 2
         ELSE 3 END,
    -- Then by name for consistent ordering
    c.name,
    -- Finally by set and number
    c.set_code,
    c.card_number
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_cards(TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION search_cards(TEXT) IS 'Search cards by name, set_code, or card_number. Returns top 20 matches ordered by relevance.'; 