-- Add image_url column to card_embeddings table
ALTER TABLE card_embeddings 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add name column to card_embeddings table for better lookup performance
ALTER TABLE card_embeddings 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add set_code column to card_embeddings table
ALTER TABLE card_embeddings 
ADD COLUMN IF NOT EXISTS set_code TEXT;

-- Add card_number column to card_embeddings table  
ALTER TABLE card_embeddings 
ADD COLUMN IF NOT EXISTS card_number TEXT;

-- Add rarity column to card_embeddings table
ALTER TABLE card_embeddings 
ADD COLUMN IF NOT EXISTS rarity TEXT;