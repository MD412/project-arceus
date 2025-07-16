-- Add training flag columns to card_detections table
ALTER TABLE card_detections 
ADD COLUMN IF NOT EXISTS is_training_candidate BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS training_flagged_at TIMESTAMPTZ;
 
-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_card_detections_training 
ON card_detections(is_training_candidate) 
WHERE is_training_candidate = TRUE; 