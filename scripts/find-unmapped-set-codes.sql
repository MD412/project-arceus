-- Find all unique set_codes that are still showing as codes (not translated)
-- These are codes where set_name = set_code (fallback behavior)

SELECT DISTINCT set_code, set_name, COUNT(*) as card_count
FROM cards
WHERE set_code IS NOT NULL 
  AND set_name = set_code  -- This means mapping failed, using fallback
ORDER BY card_count DESC, set_code;

-- Also check card_embeddings
SELECT DISTINCT set_code, set_name, COUNT(*) as embedding_count
FROM card_embeddings
WHERE set_code IS NOT NULL 
  AND set_name = set_code
ORDER BY embedding_count DESC, set_code;

