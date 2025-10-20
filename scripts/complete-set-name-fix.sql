-- Complete Set Name Fix
-- Run this entire script in Supabase Studio SQL Editor
-- Fixes set_name display issue by populating both card_embeddings and cards tables

-- ========================================
-- STEP 1: Add column to card_embeddings
-- ========================================
ALTER TABLE card_embeddings 
ADD COLUMN IF NOT EXISTS set_name TEXT;

CREATE INDEX IF NOT EXISTS idx_card_embeddings_set_code ON card_embeddings(set_code);

-- ========================================
-- STEP 2: Create mapping function
-- ========================================
CREATE OR REPLACE FUNCTION get_set_name_from_code(code TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN CASE code
    -- Scarlet & Violet Era
    WHEN 'sv1' THEN 'Scarlet & Violet'
    WHEN 'sv2' THEN 'Paldea Evolved'
    WHEN 'sv3' THEN 'Obsidian Flames'
    WHEN 'sv4' THEN '151'
    WHEN 'sv5' THEN 'Temporal Forces'
    WHEN 'sv6' THEN 'Twilight Masquerade'
    WHEN 'sv7' THEN 'Stellar Crown'
    WHEN 'sv8' THEN 'Surging Sparks'
    WHEN 'sv8pt5' THEN 'Surging Sparks: Blooming Evolutions'
    WHEN 'sve' THEN 'Scarlet & Violet Energies'
    WHEN 'svp' THEN 'SV Black Star Promos'
    
    -- Sword & Shield Era  
    WHEN 'swsh1' THEN 'Sword & Shield'
    WHEN 'swsh2' THEN 'Rebel Clash'
    WHEN 'swsh3' THEN 'Darkness Ablaze'
    WHEN 'swsh4' THEN 'Vivid Voltage'
    WHEN 'swsh5' THEN 'Battle Styles'
    WHEN 'swsh6' THEN 'Chilling Reign'
    WHEN 'swsh7' THEN 'Evolving Skies'
    WHEN 'swsh8' THEN 'Fusion Strike'
    WHEN 'swsh9' THEN 'Brilliant Stars'
    WHEN 'swsh10' THEN 'Astral Radiance'
    WHEN 'swsh11' THEN 'Lost Origin'
    WHEN 'swsh12' THEN 'Silver Tempest'
    WHEN 'swsh12pt5' THEN 'Crown Zenith'
    WHEN 'swsh12pt5gg' THEN 'Crown Zenith Galarian Gallery'
    WHEN 'swshp' THEN 'SWSH Black Star Promos'
    
    -- Sun & Moon Era
    WHEN 'sm1' THEN 'Sun & Moon'
    WHEN 'sm2' THEN 'Guardians Rising'
    WHEN 'sm3' THEN 'Burning Shadows'
    WHEN 'sm4' THEN 'Crimson Invasion'
    WHEN 'sm5' THEN 'Ultra Prism'
    WHEN 'sm6' THEN 'Forbidden Light'
    WHEN 'sm7' THEN 'Celestial Storm'
    WHEN 'sm8' THEN 'Lost Thunder'
    WHEN 'sm9' THEN 'Team Up'
    WHEN 'sm10' THEN 'Unbroken Bonds'
    WHEN 'sm11' THEN 'Unified Minds'
    WHEN 'sm12' THEN 'Cosmic Eclipse'
    
    -- XY Era
    WHEN 'xy1' THEN 'XY'
    WHEN 'xy2' THEN 'Flashfire'
    WHEN 'xy3' THEN 'Furious Fists'
    WHEN 'xy4' THEN 'Phantom Forces'
    WHEN 'xy5' THEN 'Primal Clash'
    WHEN 'xy6' THEN 'Roaring Skies'
    WHEN 'xy7' THEN 'Ancient Origins'
    WHEN 'xy8' THEN 'BREAKthrough'
    WHEN 'xy9' THEN 'BREAKpoint'
    WHEN 'xy10' THEN 'Fates Collide'
    WHEN 'xy11' THEN 'Steam Siege'
    WHEN 'xy12' THEN 'Evolutions'
    
    -- Black & White Era
    WHEN 'bw1' THEN 'Black & White'
    WHEN 'bw2' THEN 'Emerging Powers'
    WHEN 'bw3' THEN 'Noble Victories'
    WHEN 'bw4' THEN 'Next Destinies'
    WHEN 'bw5' THEN 'Dark Explorers'
    WHEN 'bw6' THEN 'Dragons Exalted'
    WHEN 'bw7' THEN 'Boundaries Crossed'
    WHEN 'bw8' THEN 'Plasma Storm'
    WHEN 'bw9' THEN 'Plasma Freeze'
    WHEN 'bw10' THEN 'Plasma Blast'
    WHEN 'bw11' THEN 'Legendary Treasures'
    
    -- HeartGold SoulSilver Era
    WHEN 'hgss1' THEN 'HeartGold & SoulSilver'
    WHEN 'hgss2' THEN 'HS—Unleashed'
    WHEN 'hgss3' THEN 'HS—Undaunted'
    WHEN 'hgss4' THEN 'HS—Triumphant'
    
    -- Base Era
    WHEN 'base1' THEN 'Base Set'
    WHEN 'base2' THEN 'Jungle'
    WHEN 'base3' THEN 'Fossil'
    WHEN 'base4' THEN 'Base Set 2'
    WHEN 'base5' THEN 'Team Rocket'
    WHEN 'gym1' THEN 'Gym Heroes'
    WHEN 'gym2' THEN 'Gym Challenge'
    WHEN 'neo1' THEN 'Neo Genesis'
    WHEN 'neo2' THEN 'Neo Discovery'
    WHEN 'neo3' THEN 'Neo Revelation'
    WHEN 'neo4' THEN 'Neo Destiny'
    
    ELSE code -- Fallback: use code itself if not mapped
  END;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 3: Backfill card_embeddings
-- ========================================
UPDATE card_embeddings 
SET set_name = get_set_name_from_code(set_code)
WHERE set_name IS NULL 
  AND set_code IS NOT NULL
  AND set_code != '';

-- ========================================
-- STEP 4: Backfill cards from embeddings
-- ========================================
-- First try to pull from card_embeddings (if it has set_name now)
UPDATE cards c
SET set_name = e.set_name
FROM card_embeddings e
WHERE c.pokemon_tcg_api_id = e.card_id
  AND c.set_name IS NULL
  AND e.set_name IS NOT NULL;

-- Then compute for any remaining NULL set_names
UPDATE cards 
SET set_name = get_set_name_from_code(set_code)
WHERE set_name IS NULL 
  AND set_code IS NOT NULL
  AND set_code != '';

-- ========================================
-- STEP 5: Verification
-- ========================================
-- Show updated counts
SELECT 
  'card_embeddings' AS table_name,
  COUNT(*) FILTER (WHERE set_name IS NOT NULL) AS has_set_name,
  COUNT(*) FILTER (WHERE set_name IS NULL) AS missing_set_name,
  COUNT(*) AS total
FROM card_embeddings
WHERE set_code IS NOT NULL

UNION ALL

SELECT 
  'cards' AS table_name,
  COUNT(*) FILTER (WHERE set_name IS NOT NULL) AS has_set_name,
  COUNT(*) FILTER (WHERE set_name IS NULL) AS missing_set_name,
  COUNT(*) AS total
FROM cards
WHERE set_code IS NOT NULL;

-- Show sample of updated rows
SELECT 
  'Sample updated card_embeddings:' AS info,
  card_id,
  set_code,
  set_name
FROM card_embeddings
WHERE set_name IS NOT NULL
LIMIT 5;

SELECT 
  'Sample updated cards:' AS info,
  name,
  set_code,
  set_name
FROM cards
WHERE set_name IS NOT NULL
LIMIT 5;

-- ========================================
-- STEP 6: Cleanup
-- ========================================
-- Keep the function for future use (don't drop it)
-- DROP FUNCTION IF EXISTS get_set_name_from_code;

-- Done!
SELECT '✅ Set name fix complete!' AS status;

