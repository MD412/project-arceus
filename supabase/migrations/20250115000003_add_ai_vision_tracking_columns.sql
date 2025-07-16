-- Add AI Vision tracking columns to card_detections table
-- Supports Premium GPT-4o Mini + CLIP hybrid identification system

-- Add identification method tracking
ALTER TABLE card_detections 
ADD COLUMN identification_method TEXT DEFAULT 'clip';

-- Add cost tracking for GPT calls
ALTER TABLE card_detections 
ADD COLUMN identification_cost DECIMAL(8,6) DEFAULT 0.0;

-- Add AI confidence score tracking
ALTER TABLE card_detections 
ADD COLUMN identification_confidence DECIMAL(3,2) DEFAULT 0.0;

-- Add index for cost analysis queries
CREATE INDEX IF NOT EXISTS idx_card_detections_identification_method 
ON card_detections(identification_method);

-- Add index for cost tracking
CREATE INDEX IF NOT EXISTS idx_card_detections_identification_cost 
ON card_detections(identification_cost) 
WHERE identification_cost > 0;

-- Add check constraint for confidence range
ALTER TABLE card_detections 
ADD CONSTRAINT chk_identification_confidence 
CHECK (identification_confidence >= 0.0 AND identification_confidence <= 1.0);

-- Comment the columns for clarity
COMMENT ON COLUMN card_detections.identification_method IS 'AI method used: clip, gpt, cached, failed, etc.';
COMMENT ON COLUMN card_detections.identification_cost IS 'Cost in USD for AI identification (GPT calls)';
COMMENT ON COLUMN card_detections.identification_confidence IS 'AI confidence score (0.0-1.0)';

-- Grant necessary permissions
GRANT SELECT ON card_detections TO authenticated;
GRANT INSERT, UPDATE ON card_detections TO service_role; 