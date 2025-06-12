# 🚀 Weekend Demo Setup Guide

Get your **real card names and artwork** flowing in your demo in 3 simple steps!

## 🎯 What This Does

Instead of showing "Unknown Card" placeholders, your demo will display:
- **Real card names**: "Charizard ex", "Pikachu VMAX", etc.
- **Set information**: "Scarlet & Violet (SV1 #025)"
- **Market pricing**: "$45.99" 
- **Rarity and metadata**: "Ultra Rare Holo"
- **Official card artwork**: High-res images from Pokemon TCG API

## ⚡ Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
cd workers/
pip install -r requirements.txt
```

### Step 2: Populate Master Card Catalog  
```bash
# Sync a specific set for testing (fast - ~2 minutes)
python sync_cards.py --set-code SV1 --database-url $DATABASE_URL

# OR sync recent sets (medium - ~10 minutes)  
python sync_cards.py --incremental --database-url $DATABASE_URL

# OR full sync (slow - ~30 minutes, but comprehensive)
python sync_cards.py --full-sync --database-url $DATABASE_URL
```

### Step 3: Test Card Enrichment
```bash
# Test single card lookup
python demo_integration.py --test-single --database-url $DATABASE_URL

# Enrich an existing vision job
python demo_integration.py --job-id <your-job-id> --database-url $DATABASE_URL
```

## 🔧 Integration Points

### For Your Existing Vision Pipeline

**Before (what you have now):**
```json
{
  "detection_id": "det_123",
  "bounding_box": {"x": 100, "y": 100, "width": 200, "height": 300},
  "confidence": 0.85,
  "status": "detected"
}
```

**After (with enrichment):**
```json
{
  "detection_id": "det_123", 
  "bounding_box": {"x": 100, "y": 100, "width": 200, "height": 300},
  "confidence": 0.85,
  "status": "identified",
  "card_name": "Charizard ex",
  "set_name": "Scarlet & Violet",
  "set_code": "SV1",
  "card_number": "006",
  "rarity": "Double Rare",
  "market_price": 45.99,
  "image_urls": {
    "small": "https://images.pokemontcg.io/sv1/6.png",
    "large": "https://images.pokemontcg.io/sv1/6_hires.png"
  },
  "identification_confidence": 92.5
}
```

### Wire Into Your UI Components

**Option A: Batch Processing (Recommended)**
```python
# After your vision job completes
from workers.demo_integration import DemoIntegrator

async def enrich_vision_results(job_id: str):
    async with DemoIntegrator(DATABASE_URL) as integrator:
        results = await integrator.enrich_job_detections(job_id)
        return results  # Ready for UI display
```

**Option B: Real-time Processing**
```python
# For individual card detections
from workers.enrichment_worker import enrich_single_detection, DetectionInput

async def enrich_single_card(predicted_name: str, detection_data: dict):
    detection = DetectionInput(
        detection_id=detection_data['id'],
        job_id=detection_data['job_id'],
        predicted_name=predicted_name,  # From your OCR/vision model
        confidence=detection_data['confidence'],
        bounding_box=detection_data['bounding_box'],
        cropped_image_path=detection_data['crop_path']
    )
    
    result = await enrich_single_detection(DATABASE_URL, detection)
    return result
```

## 🎮 Demo Script

Perfect for weekend demos! Shows off the "wow factor":

```bash
# Run this after processing a binder photo
python demo_integration.py --job-id <latest-job-id>
```

**Output:**
```
🎯 DEMO RESULTS FOR JOB abc123
============================================================
📊 SUMMARY:
  Total Detections: 9
  ✅ Identified: 7  
  ❓ Unidentified: 2
  ❌ Errors: 0
  Success Rate: 77.8%

🃏 IDENTIFIED CARDS:
  • Charizard ex
    Set: Scarlet & Violet (SV1 #006)
    Rarity: Double Rare | Price: $45.99 | Confidence: 92.5%
    Method: fuzzy_match

  • Pikachu VMAX
    Set: Sword & Shield (SWSH045)  
    Rarity: Promo | Price: $12.50 | Confidence: 88.2%
    Method: exact_match

🚀 Ready for demo! This shows real card names instead of placeholders.
```

## 🗄️ Database Schema

The workers expect your database to have these tables (see `docs/database-schema.md`):

- `pokemon_cards` - Master card catalog
- `card_detections` - Your vision results
- `vision_jobs` - Job tracking

**Quick setup:**
```sql
-- Run the migrations from your supabase setup
-- Tables should already exist from your current setup
```

## 🔍 How Fuzzy Matching Works

The enrichment worker is **smart about card names**:

- **"Charizard ex"** → Finds "Charizard ex (SV1 #006)"
- **"Pikachu V"** → Matches "Pikachu V (SWSH061)" 
- **"Blastoise"** → Gets best Blastoise card by market value
- **"Char"** → Fuzzy matches to "Charizard" variants
- **Typos/OCR errors** → Handles common misreads gracefully

**Confidence scoring:**
- 95%+ = Exact match
- 60%+ = High confidence fuzzy match  
- 40%+ = Viable but uncertain match
- <40% = Rejected (shows as "unidentified")

## 🚨 Troubleshooting

**No matches found?**
- Run `sync_cards.py` first to populate the database
- Check your `DATABASE_URL` environment variable
- Try with `--set-code SV1` for modern cards

**Low match rates?**
- OCR predictions might be noisy
- Use the simulation mode: `use_simulation=True` in demo
- Check card name cleaning in `enrichment_worker.py`

**Database connection issues?**
- Verify Supabase connection string
- Check if `pokemon_cards` table exists
- Test with: `python -c "import asyncpg; print('AsyncPG OK')"`

## 🎯 Demo Day Checklist

- [ ] Database populated with recent sets (`sync_cards.py --incremental`)
- [ ] Test enrichment working (`demo_integration.py --test-single`)  
- [ ] Integration point identified in your vision pipeline
- [ ] UI components ready to display card metadata
- [ ] Fallback handling for unidentified cards ("Help us train this!")

**Pro tip:** Start with `--set-code SV1` for the fastest setup - it has modern, recognizable cards perfect for demos!

## 🔗 Next Steps

After your demo success:

1. **Price tracking** - Add TCGPlayer API for live pricing
2. **Collection features** - Let users save identified cards  
3. **OCR integration** - Replace simulation with real text detection
4. **Advanced matching** - Set-specific hints from visual cues
5. **User feedback** - Let users correct misidentified cards

You're ready to blow minds! 🤯 