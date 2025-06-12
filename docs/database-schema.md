# Project Arceus - Database Schema Design

## Core Philosophy

Based on research into the Pokémon TCG ecosystem and collector behavior patterns, this schema captures both **gameplay mechanics** and **market dynamics** that drive card values. The design balances comprehensive data collection with practical implementation needs for our computer vision pipeline.

## Primary Tables

### 1. Master Card Catalog (`pokemon_cards`)

The canonical reference for all Pokémon cards across sets and printings.

```sql
CREATE TABLE pokemon_cards (
    -- Core Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_name VARCHAR(255) NOT NULL,
    set_code VARCHAR(20) NOT NULL,
    set_name VARCHAR(255) NOT NULL,
    card_number VARCHAR(20) NOT NULL,  -- e.g. "27/62", "25a/25", "PROMO"
    rarity VARCHAR(50) NOT NULL,       -- Common, Uncommon, Rare, etc.
    variant_type VARCHAR(100),         -- 1st Edition, Unlimited, Shadowless, etc.
    language VARCHAR(10) DEFAULT 'EN',
    release_date DATE,
    
    -- Pokémon Identity
    pokemon_name VARCHAR(100) NOT NULL, -- Base Pokémon name (e.g. "Charizard")
    pokemon_types TEXT[],              -- Array: ["Fire"], ["Water", "Flying"]
    evolution_stage VARCHAR(20),       -- Basic, Stage 1, Stage 2, BREAK, GX, etc.
    evolves_from VARCHAR(100),         -- Name of previous evolution
    hp INTEGER,
    
    -- Game Mechanics
    attacks JSONB DEFAULT '[]',        -- Array of attack objects
    abilities JSONB DEFAULT '[]',      -- Array of abilities/powers/bodies
    weakness JSONB,                    -- {type: "Water", modifier: "×2"}
    resistance JSONB,                  -- {type: "Fighting", modifier: "-30"}
    retreat_cost INTEGER DEFAULT 0,
    
    -- Visual & Artistic
    artist VARCHAR(255),
    illustration_rare BOOLEAN DEFAULT FALSE,
    full_art BOOLEAN DEFAULT FALSE,
    alternate_art BOOLEAN DEFAULT FALSE,
    holographic BOOLEAN DEFAULT FALSE,
    texture_type VARCHAR(50),          -- Standard, Reverse Holo, Cosmos, etc.
    
    -- Collectible Metadata
    first_edition BOOLEAN DEFAULT FALSE,
    shadowless BOOLEAN DEFAULT FALSE,
    error_card BOOLEAN DEFAULT FALSE,
    error_description TEXT,
    promotional BOOLEAN DEFAULT FALSE,
    tournament_legal BOOLEAN DEFAULT TRUE,
    
    -- Images & Assets
    image_urls JSONB DEFAULT '{}',     -- {small: "url", large: "url", hires: "url"}
    cropped_image_path TEXT,           -- Path to our cropped card image
    
    -- Market Intelligence
    tcgplayer_id VARCHAR(50),
    pokellector_id VARCHAR(50),
    psa_population_data JSONB,         -- Grade distribution stats
    current_market_price DECIMAL(10,2),
    price_last_updated TIMESTAMP,
    market_volatility_score INTEGER,   -- 1-10 scale
    
    -- Search & Classification
    keywords TEXT[],                   -- Searchable terms
    special_mechanics TEXT[],          -- V-UNION, TAG TEAM, Prime, etc.
    format_legality JSONB,             -- {standard: true, expanded: true, unlimited: true}
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    data_quality_score INTEGER DEFAULT 0, -- Confidence in data accuracy
    
    -- Indexes for performance
    CONSTRAINT unique_card_variant UNIQUE (set_code, card_number, variant_type, language)
);

-- Essential indexes
CREATE INDEX idx_pokemon_cards_name ON pokemon_cards (card_name);
CREATE INDEX idx_pokemon_cards_pokemon ON pokemon_cards (pokemon_name);
CREATE INDEX idx_pokemon_cards_set ON pokemon_cards (set_code);
CREATE INDEX idx_pokemon_cards_rarity ON pokemon_cards (rarity);
CREATE INDEX idx_pokemon_cards_price ON pokemon_cards (current_market_price DESC);
CREATE INDEX idx_pokemon_cards_release ON pokemon_cards (release_date DESC);
```

### 2. Detection Results (`card_detections`)

Links our computer vision pipeline to the master catalog.

```sql
CREATE TABLE card_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES vision_jobs(id),
    
    -- Detection Metadata
    detection_confidence FLOAT NOT NULL,
    bounding_box JSONB NOT NULL,       -- {x, y, width, height, confidence}
    cropped_image_path TEXT NOT NULL,
    tile_source VARCHAR(20),           -- Which 3x3 tile detected this
    
    -- Card Identification
    pokemon_card_id UUID REFERENCES pokemon_cards(id),
    identification_method VARCHAR(50), -- "vision_model", "manual", "fuzzy_match"
    identification_confidence FLOAT,
    fuzzy_match_score FLOAT,
    
    -- Alternative Matches
    candidate_matches JSONB DEFAULT '[]', -- Top N matches with scores
    
    -- Quality Metrics
    image_quality_score FLOAT,         -- Blur, lighting, angle assessment
    condition_estimate VARCHAR(20),    -- Mint, Near Mint, Lightly Played, etc.
    
    -- User Interaction
    user_verified BOOLEAN DEFAULT FALSE,
    user_corrected_to UUID REFERENCES pokemon_cards(id),
    verification_timestamp TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_detections_job ON card_detections (job_id);
CREATE INDEX idx_detections_card ON card_detections (pokemon_card_id);
CREATE INDEX idx_detections_confidence ON card_detections (detection_confidence DESC);
```

### 3. User Collections (`user_collections`)

Track individual collector inventories with market value tracking.

```sql
CREATE TABLE user_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Links to auth system
    pokemon_card_id UUID NOT NULL REFERENCES pokemon_cards(id),
    
    -- Ownership Details
    quantity INTEGER DEFAULT 1,
    condition VARCHAR(20) NOT NULL,    -- Based on TCG grading standards
    graded BOOLEAN DEFAULT FALSE,
    grading_company VARCHAR(20),       -- PSA, BGS, CGC, etc.
    grade VARCHAR(10),                 -- "PSA 10", "BGS 9.5", etc.
    grade_numeric FLOAT,               -- Normalized grade for sorting
    
    -- Acquisition
    acquired_date DATE,
    acquisition_price DECIMAL(10,2),
    acquisition_source VARCHAR(100),   -- "Pack Pull", "Trade", "Purchase", etc.
    
    -- Storage & Condition
    storage_location VARCHAR(255),
    condition_notes TEXT,
    
    -- Market Tracking
    estimated_value DECIMAL(10,2),     -- Current market estimate
    value_last_updated TIMESTAMP,
    peak_value DECIMAL(10,2),          -- Historical high
    peak_value_date DATE,
    
    -- Personal Notes
    personal_significance TEXT,        -- Sentimental value notes
    tags TEXT[],                       -- User-defined organization
    
    -- Collection Organization
    collection_name VARCHAR(255),      -- "Base Set Master", "Vintage Fire", etc.
    binder_page INTEGER,
    sleeve_position INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_user_card_instance UNIQUE (user_id, pokemon_card_id, condition, graded, grade)
);

CREATE INDEX idx_collections_user ON user_collections (user_id);
CREATE INDEX idx_collections_card ON user_collections (pokemon_card_id);
CREATE INDEX idx_collections_value ON user_collections (estimated_value DESC);
CREATE INDEX idx_collections_grade ON user_collections (grade_numeric DESC);
```

### 4. Market Price History (`price_history`)

Historical pricing data for market trend analysis.

```sql
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pokemon_card_id UUID NOT NULL REFERENCES pokemon_cards(id),
    
    -- Price Data
    condition VARCHAR(20) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    source VARCHAR(50) NOT NULL,       -- "tcgplayer", "ebay_sold", "troll_and_toad"
    sample_size INTEGER,               -- Number of sales averaged
    
    -- Market Context
    price_type VARCHAR(20) NOT NULL,   -- "market", "low", "mid", "high"
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Metadata
    recorded_date DATE NOT NULL,
    data_quality VARCHAR(20) DEFAULT 'good', -- good, fair, poor
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_price_record UNIQUE (pokemon_card_id, condition, source, price_type, recorded_date)
);

CREATE INDEX idx_price_history_card ON price_history (pokemon_card_id);
CREATE INDEX idx_price_history_date ON price_history (recorded_date DESC);
CREATE INDEX idx_price_history_condition ON price_history (condition);
```

### 5. Set Information (`pokemon_sets`)

Master catalog of all Pokémon TCG sets and series.

```sql
CREATE TABLE pokemon_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_code VARCHAR(20) UNIQUE NOT NULL,
    set_name VARCHAR(255) NOT NULL,
    series VARCHAR(100),               -- "Base", "Neo", "e-Card", "EX", etc.
    generation INTEGER,                -- Pokémon generation (1-9+)
    
    -- Release Information
    release_date DATE,
    total_cards INTEGER,
    secret_rares INTEGER DEFAULT 0,    -- Cards beyond main set number
    
    -- Set Characteristics
    set_type VARCHAR(50),              -- "Main Expansion", "Starter", "Promo"
    japanese_name VARCHAR(255),
    japanese_release_date DATE,
    
    -- Set Symbol & Imagery
    symbol_url TEXT,
    logo_url TEXT,
    
    -- Market Data
    booster_pack_msrp DECIMAL(6,2),
    booster_box_msrp DECIMAL(8,2),
    current_box_price DECIMAL(8,2),
    
    -- Metadata
    description TEXT,
    notable_cards TEXT[],              -- Featured chase cards
    print_run_estimate INTEGER,        -- Estimated production size
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sets_code ON pokemon_sets (set_code);
CREATE INDEX idx_sets_release ON pokemon_sets (release_date DESC);
CREATE INDEX idx_sets_series ON pokemon_sets (series);
```

### 6. Vision Jobs (`vision_jobs`)

Track computer vision processing jobs and results.

```sql
CREATE TABLE vision_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Input
    original_image_path TEXT NOT NULL,
    original_filename VARCHAR(255),
    image_size_bytes INTEGER,
    image_dimensions JSONB,            -- {width: 3024, height: 4032}
    
    -- Processing Configuration
    confidence_threshold FLOAT DEFAULT 0.15,
    iou_threshold FLOAT DEFAULT 0.5,
    model_version VARCHAR(50) DEFAULT 'yolov8n',
    
    -- Job Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    
    -- Results Summary
    cards_detected INTEGER DEFAULT 0,
    duplicates_removed INTEGER DEFAULT 0,
    processing_time_seconds FLOAT,
    
    -- Storage Paths
    processed_image_path TEXT,         -- Annotated image with bounding boxes
    crops_directory TEXT,              -- Directory containing individual crops
    
    -- Feedback Loop
    user_rating INTEGER,               -- 1-5 stars on job quality
    user_feedback TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vision_jobs_user ON vision_jobs (user_id);
CREATE INDEX idx_vision_jobs_status ON vision_jobs (status);
CREATE INDEX idx_vision_jobs_date ON vision_jobs (created_at DESC);
```

## Attack and Ability Schema

Attacks and abilities are stored as JSONB for flexibility:

```sql
-- Example attack structure
{
  "name": "Wildfire",
  "cost": ["R"],  -- R = Fire energy
  "damage": 0,
  "description": "You may discard any number of Fire Energy cards attached to Moltres when you use this attack. If you do, discard that many cards from the top of your opponent's deck.",
  "effects": ["discard_energy", "mill_opponent"]
}

-- Example ability structure  
{
  "name": "Dive Bomb",
  "type": "attack",
  "cost": ["R", "R", "R", "R"],
  "damage": 80,
  "description": "Flip a coin. If tails, this attack does nothing.",
  "coin_flip": true,
  "effects": ["conditional_damage"]
}
```

## Advanced Features

### 1. Price Prediction Model Training Data

```sql
CREATE TABLE price_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pokemon_card_id UUID NOT NULL REFERENCES pokemon_cards(id),
    prediction_date DATE NOT NULL,
    predicted_price DECIMAL(10,2) NOT NULL,
    confidence_interval JSONB, -- {lower: 45.50, upper: 67.25}
    model_version VARCHAR(50),
    actual_price DECIMAL(10,2), -- Filled in later for model validation
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. User Wishlists and Trading

```sql
CREATE TABLE user_wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    pokemon_card_id UUID NOT NULL REFERENCES pokemon_cards(id),
    max_price DECIMAL(10,2),
    condition_preference VARCHAR(20),
    priority INTEGER DEFAULT 5, -- 1-10 scale
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trade_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_user_id UUID NOT NULL,
    receiving_user_id UUID,
    status VARCHAR(20) DEFAULT 'open', -- open, accepted, declined, completed
    offer_cards JSONB NOT NULL, -- Array of {card_id, condition, quantity}
    request_cards JSONB, -- What they want in return
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Collection Analytics

```sql
CREATE TABLE collection_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    snapshot_date DATE NOT NULL,
    total_cards INTEGER,
    total_value DECIMAL(12,2),
    value_by_set JSONB, -- {set_code: value}
    value_by_rarity JSONB,
    value_distribution JSONB, -- Percentile breakdowns
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Data Quality & Enrichment Strategy

### Priority Enrichment Order
1. **Tier 1 (Vintage)**: Base Set, Jungle, Fossil (1998-2000)
2. **Tier 2 (Modern Chase)**: Current meta cards, GX/V/VMAX
3. **Tier 3 (Popular Sets)**: Neo series, e-Card, EX series
4. **Tier 4 (Recent)**: Last 2 years of releases
5. **Tier 5 (Bulk)**: Everything else

### Data Sources Integration
- **Primary**: Pokémon TCG API (official card data)
- **Pricing**: TCGPlayer API, eBay sold listings
- **Images**: Official Pokémon assets, Pokellector
- **Market Data**: PSA population reports, auction results

### Fuzzy Matching Strategy
```sql
-- Example matching logic for computer vision results
SELECT 
    pc.*,
    similarity(pc.card_name, %detected_name%) as name_score,
    similarity(pc.set_name, %detected_set%) as set_score,
    (name_score + set_score) / 2 as combined_score
FROM pokemon_cards pc
WHERE combined_score > 0.3
ORDER BY combined_score DESC
LIMIT 10;
```

## Performance Considerations

- **Partitioning**: `price_history` by year, `card_detections` by month
- **Materialized Views**: Popular collection statistics, trending cards
- **Caching**: Redis for frequently accessed price data
- **Search**: Full-text search indexes on card names, descriptions

## Migration Strategy

1. **Phase 1**: Core tables (cards, sets, detections)
2. **Phase 2**: User collections and basic pricing
3. **Phase 3**: Advanced analytics and trading features  
4. **Phase 4**: ML prediction models and optimization

This schema provides the foundation for a professional-grade Pokémon card collection management system that captures both the technical aspects collectors care about and the market dynamics that drive value.