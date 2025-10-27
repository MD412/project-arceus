-- Phase 5a: Training Feedback Table
-- Single source of truth for all card identifications and corrections

CREATE TABLE training_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Source
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  detection_id UUID REFERENCES card_detections(id) ON DELETE CASCADE,
  crop_storage_path TEXT NOT NULL,  -- path to cropped card image in storage
  
  -- Prediction
  predicted_card_id TEXT NOT NULL,   -- what model predicted
  prediction_score FLOAT NOT NULL,   -- confidence score
  prediction_method TEXT,            -- 'template_match', 'gallery_match', 'clip_only', 'UNKNOWN'
  
  -- Correction (nullable until user corrects)
  corrected_card_id TEXT,            -- what user says is correct
  corrected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  corrected_at TIMESTAMPTZ,
  
  -- Quality metadata
  quality_issues JSONB DEFAULT '{}',  -- {blur: true, glare: true, angle: 'steep', partial: true}
  user_notes TEXT,
  
  -- Training status
  training_status TEXT DEFAULT 'pending',  -- 'pending', 'added_as_template', 'skipped', 'needs_review'
  processed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_training_status CHECK (training_status IN ('pending', 'added_as_template', 'skipped', 'needs_review'))
);

-- Indexes for efficient queries
CREATE INDEX idx_training_feedback_scan ON training_feedback(scan_id);
CREATE INDEX idx_training_feedback_detection ON training_feedback(detection_id);
CREATE INDEX idx_training_feedback_status ON training_feedback(training_status) WHERE training_status = 'pending';
CREATE INDEX idx_training_feedback_predicted ON training_feedback(predicted_card_id);
CREATE INDEX idx_training_feedback_corrected ON training_feedback(corrected_card_id) WHERE corrected_card_id IS NOT NULL;
CREATE INDEX idx_training_feedback_created ON training_feedback(created_at DESC);

-- RLS Policies
ALTER TABLE training_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view feedback for their own scans
CREATE POLICY "Users see own feedback" ON training_feedback 
  FOR SELECT 
  USING (
    scan_id IN (SELECT id FROM scans WHERE user_id = auth.uid())
  );

-- Users can update corrections for their own scans
CREATE POLICY "Users correct own feedback" ON training_feedback
  FOR UPDATE
  USING (
    scan_id IN (SELECT id FROM scans WHERE user_id = auth.uid())
  );

-- Service role has full access (for worker logging)
CREATE POLICY "Service role full access" ON training_feedback 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Comment for documentation
COMMENT ON TABLE training_feedback IS 'Phase 5a: Logs every card identification for learning and improvement. Tracks predictions, corrections, and quality issues.';


