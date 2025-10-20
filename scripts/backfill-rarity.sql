-- Backfill rarity from card_embeddings to cards table
-- This script copies rarity data from card_embeddings to cards for existing cards

-- Update cards table with rarity from card_embeddings
UPDATE cards c
SET rarity = e.rarity
FROM card_embeddings e
WHERE c.pokemon_tcg_api_id = e.card_id
  AND c.rarity IS NULL
  AND e.rarity IS NOT NULL;

-- Verification: Show counts
SELECT 
  COUNT(*) FILTER (WHERE rarity IS NOT NULL) AS has_rarity,
  COUNT(*) FILTER (WHERE rarity IS NULL) AS missing_rarity,
  COUNT(*) AS total
FROM cards;

-- Sample updated rows
SELECT 
  name,
  set_code,
  card_number,
  rarity
FROM cards
WHERE rarity IS NOT NULL
LIMIT 10;

-- Show rarity distribution
SELECT 
  rarity,
  COUNT(*) as count
FROM cards
WHERE rarity IS NOT NULL
GROUP BY rarity
ORDER BY count DESC;

SELECT '✅ Rarity backfill complete!' AS status;

