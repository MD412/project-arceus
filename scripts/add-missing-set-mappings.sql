-- Add missing set code mappings to the function
-- Run this after finding unmapped codes

-- Update the function with additional mappings
CREATE OR REPLACE FUNCTION get_set_name_from_code(code TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN CASE code
    -- Scarlet & Violet Era
    WHEN 'sv1' THEN 'Scarlet & Violet'
    WHEN 'sv2' THEN 'Paldea Evolved'
    WHEN 'sv3' THEN 'Obsidian Flames'
    WHEN 'sv3pt5' THEN 'Obsidian Flames: Trainer Gallery'
    WHEN 'sv4' THEN '151'
    WHEN 'sv4pt5' THEN '151: Extras'
    WHEN 'sv5' THEN 'Temporal Forces'
    WHEN 'sv6' THEN 'Twilight Masquerade'
    WHEN 'sv6pt5' THEN 'Twilight Masquerade: Trainer Gallery'
    WHEN 'sv7' THEN 'Stellar Crown'
    WHEN 'sv7pt5' THEN 'Stellar Crown: Trainer Gallery'
    WHEN 'sv8' THEN 'Surging Sparks'
    WHEN 'sv8pt5' THEN 'Surging Sparks: Blooming Evolutions'
    WHEN 'sve' THEN 'Scarlet & Violet Energies'
    WHEN 'svp' THEN 'SV Black Star Promos'
    
    -- Sword & Shield Era  
    WHEN 'swsh1' THEN 'Sword & Shield'
    WHEN 'swsh2' THEN 'Rebel Clash'
    WHEN 'swsh3' THEN 'Darkness Ablaze'
    WHEN 'swsh4' THEN 'Vivid Voltage'
    WHEN 'swsh45' THEN 'Shining Fates'
    WHEN 'swsh5' THEN 'Battle Styles'
    WHEN 'swsh6' THEN 'Chilling Reign'
    WHEN 'swsh7' THEN 'Evolving Skies'
    WHEN 'swsh8' THEN 'Fusion Strike'
    WHEN 'swsh9' THEN 'Brilliant Stars'
    WHEN 'swsh9tg' THEN 'Brilliant Stars: Trainer Gallery'
    WHEN 'swsh10' THEN 'Astral Radiance'
    WHEN 'swsh10tg' THEN 'Astral Radiance: Trainer Gallery'
    WHEN 'swsh11' THEN 'Lost Origin'
    WHEN 'swsh11tg' THEN 'Lost Origin: Trainer Gallery'
    WHEN 'swsh12' THEN 'Silver Tempest'
    WHEN 'swsh12pt5' THEN 'Crown Zenith'
    WHEN 'swsh12pt5gg' THEN 'Crown Zenith Galarian Gallery'
    WHEN 'swshp' THEN 'SWSH Black Star Promos'
    
    -- Sun & Moon Era
    WHEN 'sm1' THEN 'Sun & Moon'
    WHEN 'sm2' THEN 'Guardians Rising'
    WHEN 'sm3' THEN 'Burning Shadows'
    WHEN 'sm35' THEN 'Shining Legends'
    WHEN 'sm4' THEN 'Crimson Invasion'
    WHEN 'sm5' THEN 'Ultra Prism'
    WHEN 'sm6' THEN 'Forbidden Light'
    WHEN 'sm7' THEN 'Celestial Storm'
    WHEN 'sm75' THEN 'Dragon Majesty'
    WHEN 'sm8' THEN 'Lost Thunder'
    WHEN 'sm9' THEN 'Team Up'
    WHEN 'sm10' THEN 'Unbroken Bonds'
    WHEN 'sm11' THEN 'Unified Minds'
    WHEN 'sm115' THEN 'Hidden Fates'
    WHEN 'sm12' THEN 'Cosmic Eclipse'
    WHEN 'smp' THEN 'SM Black Star Promos'
    
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
    WHEN 'xyp' THEN 'XY Black Star Promos'
    
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
    WHEN 'bwp' THEN 'BW Black Star Promos'
    
    -- HeartGold SoulSilver Era
    WHEN 'hgss1' THEN 'HeartGold & SoulSilver'
    WHEN 'hgss2' THEN 'HS—Unleashed'
    WHEN 'hgss3' THEN 'HS—Undaunted'
    WHEN 'hgss4' THEN 'HS—Triumphant'
    WHEN 'col1' THEN 'Call of Legends'
    
    -- Diamond & Pearl Era
    WHEN 'dp1' THEN 'Diamond & Pearl'
    WHEN 'dp2' THEN 'Mysterious Treasures'
    WHEN 'dp3' THEN 'Secret Wonders'
    WHEN 'dp4' THEN 'Great Encounters'
    WHEN 'dp5' THEN 'Majestic Dawn'
    WHEN 'dp6' THEN 'Legends Awakened'
    WHEN 'dp7' THEN 'Stormfront'
    WHEN 'dpp' THEN 'DP Black Star Promos'
    
    -- EX Era
    WHEN 'ex1' THEN 'EX Ruby & Sapphire'
    WHEN 'ex2' THEN 'EX Sandstorm'
    WHEN 'ex3' THEN 'EX Dragon'
    WHEN 'ex4' THEN 'EX Team Magma vs Team Aqua'
    WHEN 'ex5' THEN 'EX Hidden Legends'
    WHEN 'ex6' THEN 'EX FireRed & LeafGreen'
    WHEN 'ex7' THEN 'EX Team Rocket Returns'
    WHEN 'ex8' THEN 'EX Deoxys'
    WHEN 'ex9' THEN 'EX Emerald'
    WHEN 'ex10' THEN 'EX Unseen Forces'
    WHEN 'ex11' THEN 'EX Delta Species'
    WHEN 'ex12' THEN 'EX Legend Maker'
    WHEN 'ex13' THEN 'EX Holon Phantoms'
    WHEN 'ex14' THEN 'EX Crystal Guardians'
    WHEN 'ex15' THEN 'EX Dragon Frontiers'
    WHEN 'ex16' THEN 'EX Power Keepers'
    
    -- e-Card Era
    WHEN 'ecard1' THEN 'Expedition Base Set'
    WHEN 'ecard2' THEN 'Aquapolis'
    WHEN 'ecard3' THEN 'Skyridge'
    
    -- Classic Era
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
    
    -- Special/Promo Sets
    WHEN 'cel25' THEN 'Celebrations: 25th Anniversary'
    WHEN 'cel25c' THEN 'Celebrations: Classic Collection'
    WHEN 'mcd11' THEN 'McDonalds Collection 2011'
    WHEN 'mcd12' THEN 'McDonalds Collection 2012'
    WHEN 'mcd14' THEN 'McDonalds Collection 2014'
    WHEN 'mcd15' THEN 'McDonalds Collection 2015'
    WHEN 'mcd16' THEN 'McDonalds Collection 2016'
    WHEN 'mcd17' THEN 'McDonalds Collection 2017'
    WHEN 'mcd18' THEN 'McDonalds Collection 2018'
    WHEN 'mcd19' THEN 'McDonalds Collection 2019'
    WHEN 'mcd21' THEN 'McDonalds Collection 2021'
    WHEN 'mcd22' THEN 'McDonalds Collection 2022'
    WHEN 'mcd23' THEN 'McDonalds Collection 2023'
    WHEN 'pop1' THEN 'POP Series 1'
    WHEN 'pop2' THEN 'POP Series 2'
    WHEN 'pop3' THEN 'POP Series 3'
    WHEN 'pop4' THEN 'POP Series 4'
    WHEN 'pop5' THEN 'POP Series 5'
    WHEN 'pop6' THEN 'POP Series 6'
    WHEN 'pop7' THEN 'POP Series 7'
    WHEN 'pop8' THEN 'POP Series 8'
    WHEN 'pop9' THEN 'POP Series 9'
    
    ELSE code -- Fallback: use code itself if not mapped
  END;
END;
$$ LANGUAGE plpgsql;

-- Re-run backfill with updated mappings
UPDATE card_embeddings 
SET set_name = get_set_name_from_code(set_code)
WHERE set_code IS NOT NULL
  AND (set_name = set_code OR set_name IS NULL);

UPDATE cards 
SET set_name = get_set_name_from_code(set_code)
WHERE set_code IS NOT NULL
  AND (set_name = set_code OR set_name IS NULL);

-- Verify: Show counts of remaining unmapped codes
SELECT 
  set_code, 
  set_name, 
  COUNT(*) as card_count
FROM cards
WHERE set_code IS NOT NULL 
  AND set_name = set_code
GROUP BY set_code, set_name
ORDER BY card_count DESC;

SELECT '✅ Additional mappings applied!' AS status;

