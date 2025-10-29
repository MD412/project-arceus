# Phase 5b: Auto-Learning System Map

**Purpose:** Transform user corrections into better card identification  
**Status:** Design Phase  
**Owner:** Product Design + ML Pipeline  
**Last Updated:** Oct 29, 2025

---

## Quick Reference: The Feedback Loop

```
User Corrects Card → System Learns → Next Scan is Better
```

| Phase | Status | What It Does |
|-------|--------|--------------|
| **5a** | ✅ Live | Collect corrections in `training_feedback` table |
| **5b** | 🔄 Design | Process corrections into better ML model |
| **5c** | 📋 Future | User-facing ML quality dashboard |

---

## Data Architecture

### Current System (What Exists Today)

| Component | Type | Size | Purpose |
|-----------|------|------|---------|
| **Cards Table** | PostgreSQL | 15,504 rows | Card catalog (all Pokémon cards) |
| **Gallery Prototypes** | NumPy files | 46,512 vectors | 1 prototype per card × 3 templates |
| **Training Feedback** | PostgreSQL | 29 rows | User corrections (Phase 5a) |
| **CLIP Model** | PyTorch | 350 MB | Image → embedding converter |

**Storage Total:** ~600 MB  
**Search Speed:** ~100ms per scan

---

### Phase 5b Additions (What We're Building)

#### Option A: Simple Approach (Recommended for MVP)

| Component | Type | Size | Purpose |
|-----------|------|------|---------|
| **Confusion Matrix** | PostgreSQL | ~10 MB | Tracks which cards confuse each other |
| **User Templates** | NumPy files | +170 MB | User correction embeddings (10/card max) |
| **Processing Job** | Python script | N/A | Runs hourly or on-demand |

**New Total:** ~780 MB  
**Search Speed:** ~200ms per scan  
**Scalability:** ✅ Good for 5 years

#### Option B: Advanced Approach (Future Enhancement)

| Component | Type | Size | Purpose |
|-----------|------|------|---------|
| **Negative Templates** | NumPy files | +317 MB | "Not this card" examples |
| **Contrastive Prototypes** | NumPy files | +50 MB | Push-away vectors |
| **Dynamic Thresholds** | PostgreSQL | ~5 MB | Per-card confidence rules |

**New Total:** ~1.2 GB  
**Search Speed:** ~250ms per scan  
**Scalability:** ✅ Excellent, handles 10+ years

---

## Database Schema

### Existing Table: `training_feedback` (Phase 5a)

```sql
CREATE TABLE training_feedback (
  id UUID PRIMARY KEY,
  scan_id UUID REFERENCES scans(id),
  detection_id UUID REFERENCES card_detections(id),
  crop_storage_path TEXT,              -- The image crop
  predicted_card_id TEXT,               -- What model guessed (wrong)
  prediction_score FLOAT,               -- Confidence in wrong guess
  corrected_card_id TEXT,               -- What user said (correct)
  corrected_by UUID,                    -- User who corrected
  training_status TEXT,                 -- 'pending' | 'processed' | 'rejected'
  processed_at TIMESTAMP,               -- When Phase 5b processed it
  created_at TIMESTAMP
);
```

**Current Data:** 29 rows (predictions only, no corrections yet)

### New Table: `card_confusion` (Phase 5b - Option A)

```sql
CREATE TABLE card_confusion (
  id UUID PRIMARY KEY,
  card_id_wrong TEXT,                   -- Card that was wrongly predicted
  card_id_correct TEXT,                 -- Card that was actually correct
  confusion_count INT DEFAULT 1,        -- How many times confused
  avg_similarity FLOAT,                 -- How similar they look
  total_corrections INT,                -- Total user corrections
  last_confused_at TIMESTAMP,
  created_at TIMESTAMP,
  
  UNIQUE(card_id_wrong, card_id_correct)
);
```

**Example Row:**
```
card_id_wrong: 'sv5-092'      (Kingdra ex - EX Dragon)
card_id_correct: 'sv5-131'    (Kingdra ex - Black Star Promo)
confusion_count: 15           (Confused 15 times)
avg_similarity: 0.89          (Very similar!)
```

**Use Case:** Adjust thresholds for commonly confused pairs

### New Table: `template_metadata` (Phase 5b - Tracking)

```sql
CREATE TABLE template_metadata (
  id UUID PRIMARY KEY,
  card_id TEXT,                         -- Which card this template represents
  template_type TEXT,                   -- 'official' | 'user_correction'
  source_feedback_id UUID,              -- Link to training_feedback
  embedding_path TEXT,                  -- Where .npy file is stored
  quality_score FLOAT,                  -- 0-1, how good the crop is
  distinguishes_from TEXT[],            -- Cards this helps distinguish from
  added_at TIMESTAMP,
  last_used_at TIMESTAMP
);
```

**Example Row:**
```
card_id: 'sv5-131'
template_type: 'user_correction'
source_feedback_id: 'abc-123'
embedding_path: 'gallery/sv5_131/user_001.npy'
quality_score: 0.92               (High quality crop)
distinguishes_from: ['sv5-092']   (Helps distinguish from this card)
```

---

## File Storage Structure

### Current (Phase 1-5a)

```
gallery/
├── card_sv5_001/
│   ├── prototype.npy              (1 vector, mean of all templates)
│   ├── template_001.npy           (Official TCGdex scan)
│   ├── template_002.npy           (Aug: brightness)
│   └── template_003.npy           (Aug: contrast)
├── card_sv5_002/
│   └── ...
└── [15,504 card folders]
```

**Size:** ~600 MB

### With Phase 5b

```
gallery/
├── card_sv5_001/
│   ├── prototype.npy              (Updated with user crops)
│   ├── official/
│   │   ├── template_001.npy
│   │   ├── template_002.npy
│   │   └── template_003.npy
│   └── user_corrections/          ← NEW
│       ├── user_001.npy           (User crop 1)
│       ├── user_002.npy           (User crop 2)
│       └── [max 10 user crops]
├── card_sv5_131/
│   ├── prototype.npy              (Rebuilt with 8 templates)
│   ├── official/
│   │   └── [3 templates]
│   └── user_corrections/
│       ├── user_001.npy           (Distinguishes from sv5-092)
│       ├── user_002.npy
│       └── [5 user crops so far]
└── [15,504 card folders]
```

**Size:** ~780 MB

---

## Processing Pipeline (The Factory)

### Phase 5b Background Job Flow

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: HARVEST                                             │
│  Query training_feedback WHERE processed_at IS NULL         │
│  Output: Batch of 100 corrections                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: FILTER                                              │
│  • Check crop exists in storage                             │
│  • Check card_id exists in catalog                          │
│  • Check not duplicate template                             │
│  Output: ~80 high-quality corrections                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: EMBED                                               │
│  For each crop: CLIP model → 512-dim vector                │
│  Output: 80 embeddings                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: EVALUATE                                            │
│  • Similarity to correct card (should be high)              │
│  • Similarity to wrong prediction (should be low)           │
│  • Distinction gap > 0.15? → Keep                           │
│  • Distinction gap < 0.15? → Reject (ambiguous)             │
│  Output: ~50 distinctive templates                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: STORE                                               │
│  • Save embedding to gallery/card_XXX/user_corrections/     │
│  • Insert row into template_metadata                        │
│  • Update card_confusion table                              │
│  Output: Templates on disk                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: REBUILD                                             │
│  For each affected card:                                    │
│    Load all templates (official + user)                     │
│    Compute new prototype = mean(all_templates)              │
│    Save updated prototype.npy                               │
│  Output: Better prototypes                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: MARK COMPLETE                                       │
│  UPDATE training_feedback SET processed_at = NOW()          │
│  Output: Ready for next batch                               │
└─────────────────────────────────────────────────────────────┘
```

**Execution Time:** ~5 minutes for 100 corrections  
**Frequency:** Hourly (or on-demand via button)

---

## Scaling Projections

### Growth Scenarios

| Timeframe | New Corrections | Total Templates | Storage | Search Speed |
|-----------|-----------------|-----------------|---------|--------------|
| **Week 1** | 200 | 46,712 | 610 MB | 105ms |
| **Month 1** | 1,000 | 51,512 | 680 MB | 125ms |
| **Month 6** | 5,000 | 71,512 | 920 MB | 175ms |
| **Year 1** | 12,000 | 98,512 | 1.2 GB | 225ms |
| **Year 5** | 50,000 | 217,056 | 2.5 GB | 300ms |

### Limits Per Card

| Metric | Current | Phase 5b Target | Hard Cap |
|--------|---------|-----------------|----------|
| Official templates | 3 | 3 | 3 (fixed) |
| User templates | 0 | 0-10 | 10 (max) |
| Total templates | 3 | 3-13 | 13 |
| Prototype size | 512 dims | 512 dims | 512 dims |

**Key Decision:** Cap user templates at 10 per card to prevent explosion

---

## Product Decisions

### Decision Matrix: User Experience

| Question | Option A | Option B | Recommended |
|----------|----------|----------|-------------|
| **When to process?** | Hourly batch job | Immediate on correction | **Immediate** (better UX) |
| **Show progress?** | Silent background | Toast notification | **Toast** (engagement) |
| **Allow manual trigger?** | No | Admin button | **Button** (power users) |
| **Show stats?** | No dashboard | ML quality page | **Dashboard** (Phase 5c) |

### Decision Matrix: ML Strategy

| Question | Option A | Option B | Recommended |
|----------|----------|----------|-------------|
| **Store negatives?** | Metadata only | Full embeddings | **Metadata** (MVP) |
| **Template selection** | All corrections | Quality filter | **Filter** (better) |
| **Cap per card** | Unlimited | 10 user templates | **Cap at 10** |
| **Rebuild frequency** | Full weekly | Incremental live | **Incremental** |

---

## Success Metrics

### Phase 5b Goals

| Metric | Baseline (5a) | Target (5b) | How to Measure |
|--------|---------------|-------------|----------------|
| **Accuracy** | 95% | 97%+ | Test on fixture set |
| **Unknown rate** | 5% | 3% | % of "UNKNOWN" results |
| **Correction velocity** | 0/day | 50/day | User engagement |
| **Template growth** | 46,512 | 60,000 | Gallery size |
| **Confused pairs** | Unknown | < 100 pairs | Confusion matrix |

### Monthly Review Questions

1. Which cards are most confused? (Top 10 from `card_confusion`)
2. How many templates added this month?
3. Did accuracy improve? (Run test suite)
4. Are users correcting fewer cards? (Good = system learning)
5. Any cards over 10 user templates? (Cap enforcement)

---

## Implementation Checklist

### Phase 5b v1 (MVP) - 2 weeks

- [ ] Create `card_confusion` table
- [ ] Create `template_metadata` table
- [ ] Build harvest job (query training_feedback)
- [ ] Build filter logic (quality checks)
- [ ] Build embedding generator (CLIP wrapper)
- [ ] Build template storage (save .npy files)
- [ ] Build prototype rebuild (incremental)
- [ ] Add processed_at timestamp update
- [ ] Test with 100 corrections
- [ ] Deploy background job (hourly cron)

### Phase 5b v2 (Enhanced) - 1 week

- [ ] Add distinction gap evaluation
- [ ] Implement 10-template cap per card
- [ ] Add confusion matrix tracking
- [ ] Build admin trigger button
- [ ] Add toast notifications
- [ ] Create ML quality metrics endpoint

### Phase 5c (Dashboard) - 1 week

- [ ] Build ML quality page
- [ ] Show top confused cards
- [ ] Show templates added over time
- [ ] Show accuracy trend graph
- [ ] Add "Force rebuild all" admin button

---

## Factorio Analogy Summary

| Real System | Factorio Equivalent |
|-------------|---------------------|
| User correction | Raw ore on ground |
| Background job | Mining drill + conveyor belt |
| CLIP embedder | Furnace (ore → plates) |
| Quality filter | Splitter with filter inserters |
| Template storage | Steel chest |
| Prototype rebuild | Assembly machine (plates → science) |
| Confusion matrix | Circuit network conditions |
| Search pipeline | Logistics network |

---

## Emergency Contacts (Code Locations)

| Component | File Path |
|-----------|-----------|
| **CLIP Model** | `worker/openclip_embedder.py` |
| **Training Feedback Table** | `supabase/migrations/*_training_feedback*.sql` |
| **Gallery Prototypes** | `gallery/card_*/prototype.npy` |
| **Search Logic** | `worker/retrieval_v2.py` |
| **Worker Pipeline** | `worker/worker.py` |
| **Phase 5b Job** | `scripts/process_training_feedback.py` (to be created) |

---

## Status Updates

| Date | Update | Impact |
|------|--------|--------|
| Oct 27, 2025 | Phase 5a deployed | ✅ Collecting corrections |
| Oct 28, 2025 | Worker fixed | ✅ Processing scans |
| Oct 29, 2025 | Phase 5b designed | 📋 Ready to implement |

---

**Next Step:** Build Phase 5b v1 harvest job (`scripts/process_training_feedback.py`)

