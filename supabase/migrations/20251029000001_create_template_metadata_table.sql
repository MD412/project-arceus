-- Migration: Create template_metadata table for Phase 5b
-- Tracks all templates (embeddings) for each card
-- Used to manage template quality and prevent duplicate storage

CREATE TABLE template_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL,                 -- Which card this template represents
  template_type TEXT NOT NULL CHECK (template_type IN ('official', 'user_correction')),
  source_feedback_id UUID REFERENCES training_feedback(id),  -- Link back to correction
  embedding_path TEXT NOT NULL,          -- Path to .npy file in gallery
  quality_score FLOAT CHECK (quality_score >= 0 AND quality_score <= 1),
  distinguishes_from TEXT[],             -- Array of card IDs this helps distinguish from
  usage_count INT DEFAULT 0,             -- How many times used in successful matches
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure we don't duplicate templates
  CONSTRAINT uniq_embedding_path UNIQUE (embedding_path)
);

-- Indexes for fast lookups
CREATE INDEX idx_template_card_id ON template_metadata(card_id);
CREATE INDEX idx_template_type ON template_metadata(template_type);
CREATE INDEX idx_template_quality ON template_metadata(quality_score DESC);
CREATE INDEX idx_template_feedback ON template_metadata(source_feedback_id);

-- Function to count user templates per card (for cap enforcement)
CREATE OR REPLACE FUNCTION count_user_templates(p_card_id TEXT)
RETURNS INT AS $$
  SELECT COUNT(*)::INT
  FROM template_metadata
  WHERE card_id = p_card_id
    AND template_type = 'user_correction';
$$ LANGUAGE sql STABLE;

-- Function to get lowest quality user template for a card (for replacement)
CREATE OR REPLACE FUNCTION get_lowest_quality_template(p_card_id TEXT)
RETURNS UUID AS $$
  SELECT id
  FROM template_metadata
  WHERE card_id = p_card_id
    AND template_type = 'user_correction'
  ORDER BY quality_score ASC, added_at ASC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- RLS policies
ALTER TABLE template_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_metadata_read_all"
  ON template_metadata FOR SELECT
  USING (true);  -- Anyone can read template metadata

CREATE POLICY "template_metadata_service_write"
  ON template_metadata FOR ALL
  USING (auth.role() = 'service_role');  -- Only service can write

COMMENT ON TABLE template_metadata IS 'Phase 5b: Tracks all card templates (embeddings) for ML model management';
COMMENT ON COLUMN template_metadata.distinguishes_from IS 'Array of card IDs that this template helps distinguish from (negative training)';
COMMENT ON COLUMN template_metadata.quality_score IS 'Quality score 0-1 based on sharpness, lighting, and distinction gap';

