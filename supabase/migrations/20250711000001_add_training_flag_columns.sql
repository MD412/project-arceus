-- Add columns to track which scans have been flagged for training
ALTER TABLE public.scan_uploads
ADD COLUMN IF NOT EXISTS is_training_candidate boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS training_flagged_at timestamptz;
 
-- Create an index for faster queries on training candidates
CREATE INDEX IF NOT EXISTS idx_scan_uploads_training_candidate 
ON public.scan_uploads(is_training_candidate) 
WHERE is_training_candidate = true; 