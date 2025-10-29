# Phase 5b Auto-Learning - Quick Start

## What Was Built

### Database Tables (✅ Deployed)
1. **`card_confusion`** - Tracks which cards confuse the model
2. **`template_metadata`** - Manages all template embeddings with quality scores

### Processing Script
**`scripts/process_training_feedback.py`** - The 7-step factory pipeline:
1. Harvest corrections from `training_feedback`
2. Filter for quality (crop exists, card exists, not duplicate)
3. Generate CLIP embeddings
4. Evaluate distinction gap & quality
5. Store templates to gallery
6. Rebuild prototypes for affected cards
7. Mark as processed

### Code Changes
- Added `embed_image_bytes()` to `worker/openclip_embedder.py`
- Added class alias `OpenCLIPEmbedder`

---

## How to Use

### Run the Processor

```bash
# Process all pending corrections
python scripts/process_training_feedback.py

# Process in batches
python scripts/process_training_feedback.py --batch-size 50

# Dry run (no changes)
python scripts/process_training_feedback.py --dry-run
```

### Check Status

```sql
-- See unprocessed corrections
SELECT COUNT(*) FROM training_feedback WHERE processed_at IS NULL;

-- See confusion matrix
SELECT * FROM card_confusion ORDER BY confusion_count DESC LIMIT 10;

-- See template stats
SELECT 
  card_id,
  COUNT(*) as template_count,
  AVG(quality_score) as avg_quality
FROM template_metadata
WHERE template_type = 'user_correction'
GROUP BY card_id
ORDER BY template_count DESC;
```

---

## What Happens Next

**When users correct cards:**
1. Frontend saves to `training_feedback` ✅ (Phase 5a)
2. Background job processes corrections 🔄 (Phase 5b - you run script)
3. Templates added to gallery → Accuracy improves! 🚀

**Current state:**
- 29 detections logged (no corrections yet)
- Once users start correcting, run the script to learn from them

---

## Testing

```bash
# 1. Check current training_feedback data
python scripts/test_phase5b.py

# 2. Run processor (dry run first)
python scripts/process_training_feedback.py --dry-run

# 3. If looks good, run for real
python scripts/process_training_feedback.py

# 4. Verify templates created
ls -la gallery/card_*/user_corrections/
```

---

## Automation (Future)

To run automatically every hour:

### Option A: Cron (Linux/Mac)
```cron
0 * * * * cd /path/to/project && python scripts/process_training_feedback.py >> logs/phase5b.log 2>&1
```

### Option B: Windows Task Scheduler
Create task that runs `run_phase5b.ps1` hourly

### Option C: Supabase Edge Function
Trigger on `training_feedback` INSERT (real-time)

---

## Monitoring

Watch these metrics:
- Templates added per day
- Cards most frequently corrected
- Accuracy improvement over time
- Unknown rate trending down

---

## Next Steps

1. ✅ Database tables deployed
2. ✅ Processing script ready
3. 🔄 **Test with real corrections** (need users to correct cards)
4. 📋 Add automation (cron/edge function)
5. 📋 Build Phase 5c dashboard (metrics UI)

**Your moat is ready to grow!** 🏗️→🏰

