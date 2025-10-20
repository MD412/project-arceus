-- Verify language column setup

-- Check column exists and its structure
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_card_instances' 
  AND column_name = 'language';

-- Check if we have any non-EN cards already tagged
SELECT 
  language,
  COUNT(*) as count
FROM user_card_instances
GROUP BY language
ORDER BY count DESC;

-- Add the constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_language_code'
  ) THEN
    ALTER TABLE user_card_instances
    ADD CONSTRAINT check_language_code 
    CHECK (language IN ('en', 'jp', 'kr', 'zh-tw', 'zh-cn', 'fr', 'de', 'it', 'es', 'pt'));
  END IF;
END $$;

-- Add index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_card_instances_language 
ON user_card_instances(language);

SELECT '✅ Language column verified and configured' AS status;


