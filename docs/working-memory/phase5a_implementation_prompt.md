# Phase 5a Implementation Prompt

## Mission
Implement training feedback loop: log every card identification, enable corrections, auto-learn from user feedback.

## Context Quick-Load
1. Read: `docs/working-memory/active_context.md` (current status)
2. Read: `docs/working-memory/handoffs/2025/10-october/context_handoff_20251026_0100.md` (latest session)
3. Read: `worker/retrieval_v2.py` (current identification logic)
4. Read: `worker/worker.py` (job processing loop)

## System State
- **Retrieval v2 LIVE** with `RETRIEVAL_IMPL=v2` env var
- Worker at `worker/worker.py` processes scan jobs from `jobs` table
- Cards identified via `retrieval_v2.identify_v2()` returning `{card_id, score, method}`
- Results saved to `detections` table
- Gallery: 15,504 cards, 46,512+ templates in `card_gallery` + `card_templates`
- Domain gap: Official art (0.65 sim) vs clean scans (1.0 sim) — need more real scan templates

## Phase 5a Deliverables

### 1. Create `training_feedback` Table
**File:** `supabase/migrations/20251027000000_create_training_feedback_table.sql`

**Schema:**
```sql
CREATE TABLE training_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Source
  scan_id UUID REFERENCES scans(id),
  detection_id UUID REFERENCES detections(id),
  crop_storage_path TEXT NOT NULL,  -- path to cropped card image
  
  -- Prediction
  predicted_card_id TEXT NOT NULL,   -- what model said
  prediction_score FLOAT NOT NULL,   -- confidence
  prediction_method TEXT,            -- 'template_match', 'clip_only', etc
  
  -- Correction (nullable until corrected)
  corrected_card_id TEXT,            -- what user says is correct
  corrected_by UUID REFERENCES auth.users(id),
  corrected_at TIMESTAMPTZ,
  
  -- Quality metadata
  quality_issues JSONB,              -- {blur: true, glare: true, angle: 'steep'}
  user_notes TEXT,
  
  -- Training status
  training_status TEXT DEFAULT 'pending',  -- 'pending', 'added_as_template', 'skipped', 'needs_review'
  processed_at TIMESTAMPTZ,
  
  -- Indexes
  CONSTRAINT valid_training_status CHECK (training_status IN ('pending', 'added_as_template', 'skipped', 'needs_review'))
);

CREATE INDEX idx_training_feedback_scan ON training_feedback(scan_id);
CREATE INDEX idx_training_feedback_status ON training_feedback(training_status);
CREATE INDEX idx_training_feedback_predicted ON training_feedback(predicted_card_id);
CREATE INDEX idx_training_feedback_corrected ON training_feedback(corrected_card_id);

-- RLS
ALTER TABLE training_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own feedback" ON training_feedback FOR SELECT USING (
  scan_id IN (SELECT id FROM scans WHERE user_id = auth.uid())
);
CREATE POLICY "Service role full access" ON training_feedback FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role'
);
```

### 2. Update Worker Logging
**File:** `worker/worker.py`

**Add after identification (around line where results saved to detections):**
```python
# Log to training_feedback
await log_training_feedback(
    supabase=supabase,
    scan_id=job_data['scan_id'],
    detection_id=detection_id,
    crop_storage_path=crop_path,  # from detection processing
    predicted_card_id=result['card_id'],
    prediction_score=result['score'],
    prediction_method=result.get('method', 'unknown')
)
```

**Add helper function:**
```python
async def log_training_feedback(supabase, scan_id, detection_id, crop_storage_path, 
                                 predicted_card_id, prediction_score, prediction_method):
    """Log identification to training feedback table."""
    try:
        await supabase.table('training_feedback').insert({
            'scan_id': scan_id,
            'detection_id': detection_id,
            'crop_storage_path': crop_storage_path,
            'predicted_card_id': predicted_card_id,
            'prediction_score': prediction_score,
            'prediction_method': prediction_method,
            'training_status': 'pending'
        }).execute()
    except Exception as e:
        logger.error(f"Failed to log training feedback: {e}")
        # Don't fail job on logging error
```

### 3. Connect Correction API to Training Feedback
**File:** `app/api/detections/[id]/correct/route.ts`

**Update existing correction endpoint to also log to training_feedback:**
```typescript
// After updating card_detections.guess_card_id
// Add Phase 5a: Update training_feedback with correction
try {
  const { error: feedbackErr } = await supabase
    .from('training_feedback')
    .update({
      corrected_card_id: replacement.id,
      corrected_by: user.id,
      corrected_at: new Date().toISOString(),
    })
    .eq('detection_id', id);
  
  if (feedbackErr) {
    console.warn('Failed to update training_feedback:', feedbackErr);
    // Don't fail the request on feedback logging error
  }
} catch (feedbackError) {
  console.warn('Error updating training_feedback:', feedbackError);
}
```

**Note:** Correction UI already exists (`DetectionGrid` component). No frontend changes needed.

### 4. Test Loop
```bash
# 1. Upload scan with known card
# 2. Verify training_feedback row created
supabase db execute "SELECT * FROM training_feedback ORDER BY created_at DESC LIMIT 5"

# 3. Correct a card via UI
# 4. Verify corrected_card_id populated
# 5. Run background job to add as template (Phase 5b - future)
```

## Key Technical Details

### Current Worker Flow
1. Job dequeued from `jobs` table
2. Scan image downloaded from storage
3. YOLO detects cards → crops
4. Each crop → `identify_v2()` → `{card_id, score, method}`
5. Results saved to `detections` table
6. **NEW:** Also log to `training_feedback`

### Retrieval v2 Methods
- `template_match`: Found in `card_templates` (real scans, best quality)
- `gallery_match`: Found in `card_gallery` (official art, domain gap)
- `clip_only`: Fallback text search
- `UNKNOWN`: Score < 0.80 threshold

### Database Relationships
```
scans (user's upload)
  └─> detections (identified cards)
        └─> training_feedback (logged for learning)
```

### Environment
- Supabase project: Production DB (stealth project, no local link)
- Worker: Deployed on Render, triggered via env var changes
- Storage: Supabase Storage for images
- Python worker uses `supabase-py` client

## Success Criteria
✅ Migration creates `training_feedback` table with proper indexes/RLS
✅ Every card identification logged to table
✅ UI allows correcting wrong predictions
✅ Corrected data stored with user + timestamp
✅ Test scan shows feedback entries in DB

## Future Phases (Don't implement yet)
- **5b:** Background job auto-adds high-confidence corrections as templates
- **5c:** Dashboard for confusion matrix, training queue
- **5d:** Export batches, fine-tune ViT model

## Files to Examine
- `worker/worker.py` - Main job loop
- `worker/retrieval_v2.py` - Identification logic
- `supabase/migrations/` - Schema patterns
- `app/(main)/scans/[id]/` - Scan detail UI (find exact file)

## Commands
```bash
# Apply migration
supabase db push

# Check recent feedback
supabase db execute "SELECT * FROM training_feedback ORDER BY created_at DESC LIMIT 10"

# Find scan detail page
fd -e tsx -e ts "scans" app/
```

---

**Start here:** Create migration → Apply → Update worker → Connect correction API → Test

**Frontend UI:** Already exists. Phase 5a is backend-only (database + worker + API).

