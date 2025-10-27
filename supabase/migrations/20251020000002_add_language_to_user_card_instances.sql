-- Add language support to user card instances
-- Allows users to tag cards as EN, JP, KR, etc.

ALTER TABLE user_card_instances 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add index for language filtering/queries
CREATE INDEX IF NOT EXISTS idx_user_card_instances_language 
ON user_card_instances(language);

-- Add check constraint to ensure valid language codes (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_language_code' 
    AND conrelid = 'user_card_instances'::regclass
  ) THEN
    ALTER TABLE user_card_instances
    ADD CONSTRAINT check_language_code 
    CHECK (language IN ('en', 'jp', 'kr', 'zh-tw', 'zh-cn', 'fr', 'de', 'it', 'es', 'pt'));
  END IF;
END $$;

-- Verify the change
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_card_instances' 
  AND column_name = 'language';

SELECT '✅ Language column added to user_card_instances' AS status;



