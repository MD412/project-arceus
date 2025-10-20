-- Add language support to user_cards table (the actual table in use)
-- Previous migration targeted wrong table (user_card_instances)

ALTER TABLE user_cards 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add index for language filtering/queries
CREATE INDEX IF NOT EXISTS idx_user_cards_language 
ON user_cards(language);

-- Add check constraint to ensure valid language codes
ALTER TABLE user_cards
DROP CONSTRAINT IF EXISTS check_language_code;

ALTER TABLE user_cards
ADD CONSTRAINT check_language_code 
CHECK (language IN ('en', 'jp', 'kr', 'zh-tw', 'zh-cn', 'fr', 'de', 'it', 'es', 'pt'));

-- Verify
SELECT '✅ Language column added to user_cards table' AS status;


