-- Phase 2: Gallery schema for OpenCLIP-based retrieval
-- Ensure pgvector extension is available
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table to store per-template embeddings (L2-normalized, dim=768)
CREATE TABLE IF NOT EXISTS card_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id text NOT NULL,
    set_id text,
    variant text,
    source text NOT NULL,
    aug_tag text,
    emb vector(768) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create table to store per-card prototype embeddings (mean of templates)
CREATE TABLE IF NOT EXISTS card_prototypes (
    card_id text PRIMARY KEY,
    set_id text,
    emb vector(768) NOT NULL,
    template_count int NOT NULL,
    updated_at timestamptz DEFAULT now()
);

-- Ensure templates are unique per card/source/variant/augmentation combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_card_templates_unique
    ON card_templates (card_id, source, COALESCE(variant, ''), COALESCE(aug_tag, ''));

-- Attempt to create preferred HNSW index, fall back to IVFFlat if unavailable
DO $$
BEGIN
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_card_templates_hnsw_cos
            ON card_templates
         USING hnsw (emb vector_cosine_ops)
         WITH (m = 16, ef_construction = 200);
    EXCEPTION
        WHEN undefined_object OR invalid_parameter_value OR feature_not_supported THEN
            RAISE NOTICE 'HNSW index creation failed, falling back to IVFFlat.';
            CREATE INDEX IF NOT EXISTS idx_card_templates_ivf_cos
                ON card_templates
             USING ivfflat (emb vector_cosine_ops)
             WITH (lists = 200);
    END;
END;
$$;
