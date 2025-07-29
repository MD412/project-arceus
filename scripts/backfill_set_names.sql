-- Backfill Set Names for Existing Cards
-- Run this script to identify and update cards missing set_name data
-- Created: July 16, 2025

-- 1. Identify cards with missing set_name but valid set_code
SELECT 
    id,
    name,
    set_code,
    card_number,
    set_name,
    created_at
FROM cards 
WHERE set_name IS NULL 
  AND set_code IS NOT NULL 
  AND set_code != 'unknown'
ORDER BY created_at DESC
LIMIT 100;

-- 2. Count of cards needing backfill by set_code
SELECT 
    set_code,
    COUNT(*) as missing_set_name_count
FROM cards 
WHERE set_name IS NULL 
  AND set_code IS NOT NULL 
  AND set_code != 'unknown'
GROUP BY set_code
ORDER BY missing_set_name_count DESC;

-- 3. Manual backfill for common sets (add more as needed)
-- Uncomment and run these updates after verifying the set mappings

/*
UPDATE cards 
SET set_name = 'Scarlet & Violet' 
WHERE set_code = 'sv1' AND set_name IS NULL;

UPDATE cards 
SET set_name = 'Base Set' 
WHERE set_code = 'base1' AND set_name IS NULL;

UPDATE cards 
SET set_name = 'Jungle' 
WHERE set_code = 'base2' AND set_name IS NULL;

UPDATE cards 
SET set_name = 'Fossil' 
WHERE set_code = 'base3' AND set_name IS NULL;

UPDATE cards 
SET set_name = 'Team Rocket' 
WHERE set_code = 'base4' AND set_name IS NULL;

UPDATE cards 
SET set_name = 'Gym Heroes' 
WHERE set_code = 'base5' AND set_name IS NULL;

UPDATE cards 
SET set_name = 'XY' 
WHERE set_code = 'xy1' AND set_name IS NULL;

UPDATE cards 
SET set_name = 'Sun & Moon' 
WHERE set_code = 'sm1' AND set_name IS NULL;

UPDATE cards 
SET set_name = 'Sword & Shield' 
WHERE set_code = 'swsh1' AND set_name IS NULL;
*/

-- 4. Verification query - run after updates
SELECT 
    set_code,
    set_name,
    COUNT(*) as card_count
FROM cards 
WHERE set_code IS NOT NULL 
  AND set_code != 'unknown'
GROUP BY set_code, set_name
ORDER BY set_code, set_name;

-- 5. Remaining cards still needing set_name
SELECT COUNT(*) as still_missing_set_name
FROM cards 
WHERE set_name IS NULL 
  AND set_code IS NOT NULL 
  AND set_code != 'unknown'; 