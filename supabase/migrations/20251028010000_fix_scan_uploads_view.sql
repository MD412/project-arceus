-- Fix scan_uploads view to show actual detection counts
-- Problem: total_cards_detected was hardcoded to 0

DROP VIEW IF EXISTS scan_uploads CASCADE;

CREATE OR REPLACE VIEW scan_uploads AS
SELECT 
    s.id,
    s.user_id,
    s.title AS scan_title,
    s.status AS processing_status,
    s.progress,
    s.storage_path,
    s.summary_image_path,
    s.error_message,
    s.created_at,
    s.updated_at,
    -- Compute actual card count from detections
    jsonb_build_object(
        'summary_image_path', s.summary_image_path,
        'total_cards_detected', COALESCE(
            (SELECT COUNT(*)::int 
             FROM card_detections cd 
             WHERE cd.scan_id = s.id),
            0
        )
    ) AS results,
    s.storage_path AS content_hash
FROM scans s;

-- Make the view auto-updatable for backwards compatibility
CREATE OR REPLACE RULE scan_uploads_update AS
ON UPDATE TO scan_uploads
DO INSTEAD
UPDATE scans
SET
    title = NEW.scan_title,
    status = NEW.processing_status,
    progress = NEW.progress,
    summary_image_path = NEW.summary_image_path,
    error_message = NEW.error_message,
    updated_at = NOW()
WHERE id = NEW.id;

CREATE OR REPLACE RULE scan_uploads_delete AS
ON DELETE TO scan_uploads
DO INSTEAD
DELETE FROM scans
WHERE id = OLD.id;


