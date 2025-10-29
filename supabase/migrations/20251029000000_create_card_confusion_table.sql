-- Migration: Create card_confusion table for Phase 5b
-- Tracks which cards are commonly confused with each other
-- Used to adjust similarity thresholds and improve accuracy

CREATE TABLE card_confusion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id_wrong TEXT NOT NULL,           -- Card that was wrongly predicted
  card_id_correct TEXT NOT NULL,         -- Card that was actually correct
  confusion_count INT DEFAULT 1,         -- How many times this pair was confused
  avg_similarity FLOAT,                  -- Average similarity score between them
  total_corrections INT DEFAULT 1,       -- Total user corrections for this pair
  last_confused_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure we don't duplicate confusion pairs
  CONSTRAINT uniq_confusion_pair UNIQUE (card_id_wrong, card_id_correct)
);

-- Index for fast lookups by either card
CREATE INDEX idx_card_confusion_wrong ON card_confusion(card_id_wrong);
CREATE INDEX idx_card_confusion_correct ON card_confusion(card_id_correct);
CREATE INDEX idx_card_confusion_count ON card_confusion(confusion_count DESC);

-- Function to upsert confusion pairs
CREATE OR REPLACE FUNCTION update_card_confusion(
  p_wrong TEXT,
  p_correct TEXT,
  p_similarity FLOAT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO card_confusion (
    card_id_wrong,
    card_id_correct,
    confusion_count,
    avg_similarity,
    total_corrections,
    last_confused_at
  ) VALUES (
    p_wrong,
    p_correct,
    1,
    p_similarity,
    1,
    NOW()
  )
  ON CONFLICT (card_id_wrong, card_id_correct)
  DO UPDATE SET
    confusion_count = card_confusion.confusion_count + 1,
    avg_similarity = (card_confusion.avg_similarity * card_confusion.total_corrections + p_similarity) 
                     / (card_confusion.total_corrections + 1),
    total_corrections = card_confusion.total_corrections + 1,
    last_confused_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS policies (admin only for now)
ALTER TABLE card_confusion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "card_confusion_read_all"
  ON card_confusion FOR SELECT
  USING (true);  -- Anyone can read confusion stats

CREATE POLICY "card_confusion_service_write"
  ON card_confusion FOR ALL
  USING (auth.role() = 'service_role');  -- Only service can write

COMMENT ON TABLE card_confusion IS 'Phase 5b: Tracks which cards are commonly confused with each other for ML improvements';

