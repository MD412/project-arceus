-- Final fixes for worker schema issues

-- 1. Change guess_card_id from UUID to TEXT (card IDs are strings like "sma-SV72")
ALTER TABLE card_detections 
ALTER COLUMN guess_card_id TYPE text;

-- This will allow the worker to insert card IDs like "sma-SV72" without UUID errors