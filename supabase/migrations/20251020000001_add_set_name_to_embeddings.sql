-- Add set_name column to card_embeddings table
-- This allows us to store the human-readable set name alongside the set code

ALTER TABLE card_embeddings 
ADD COLUMN IF NOT EXISTS set_name TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_card_embeddings_set_code ON card_embeddings(set_code);

