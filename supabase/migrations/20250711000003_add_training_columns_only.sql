-- Add training flag columns to card_detections table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'card_detections' 
                   AND column_name = 'is_training_candidate') THEN
        ALTER TABLE card_detections ADD COLUMN is_training_candidate BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'card_detections' 
                   AND column_name = 'training_flagged_at') THEN
        ALTER TABLE card_detections ADD COLUMN training_flagged_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_card_detections_training 
ON card_detections(is_training_candidate) 
WHERE is_training_candidate = TRUE; 