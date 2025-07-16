-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create card_embeddings table to store OpenCLIP ViT-B/32 embeddings
CREATE TABLE card_embeddings (
    card_id TEXT PRIMARY KEY,
    embedding vector(512) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ivfflat index for fast cosine similarity search
-- Using lists=100 as a reasonable default for ~15k cards
CREATE INDEX card_embeddings_embedding_idx 
ON card_embeddings 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Add RLS policies to allow service role access
ALTER TABLE card_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow service role to read/write (for ETL and worker access)
CREATE POLICY "Service role can manage card embeddings" 
ON card_embeddings 
FOR ALL 
TO service_role 
USING (true);

-- Allow authenticated users to read embeddings (for future features)
CREATE POLICY "Authenticated users can read card embeddings" 
ON card_embeddings 
FOR SELECT 
TO authenticated 
USING (true); 