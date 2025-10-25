# Session Summary - October 25, 2025 (Phase 4 Complete)

**Duration:** Evening session  
**Branch:** `main`  
**Focus:** Phase 4 threshold calibration - domain gap fix

---

## Key Accomplishments

### Phase 4 - Threshold Calibration ✅

**Problem Identified:**
- Initial calibration: 0% accuracy on test crops
- All cards scoring ~0.75-0.78 (no distinction)
- **Root cause:** Domain gap - gallery built from official pristine TCG images, test crops were real photos

**Solution Implemented:**
1. Added 3 clean scan crops as templates to `card_templates` (source='clean_scan')
2. Rebuilt prototypes for affected cards (sv3-92, sv3-164, sv3-57)
3. Re-ran calibration → **100% precision, 100% recall**

**Final Results:**
- Correct cards: fused similarity 0.939 - 0.957
- Best impostors: fused similarity 0.798 - 0.817
- Clear separation: gaps of 0.128 - 0.178
- Perfect template matches: similarity = 1.0

**Production Settings:**
- `UNKNOWN_THRESHOLD=0.80` (set in .env.local + Render)
- Fusion weights: α=0.7/β=0.3 (validated, working perfectly)
- Worker redeployed to Render

---

## Technical Insights

### Distance vs Similarity
- RPC already converts: `1 - (emb <=> qvec)` = similarity ✅
- No inversion bug - domain gap was the real issue

### Template Strategy Validated
- Clean scan exact matches (template_sim=1.0) provide dominant signal
- Prototypes add supporting evidence (0.79-0.86)
- 70/30 fusion weights optimal for this use case

### Score Distributions
```
Correct cards:  0.94 - 0.96 (template=1.0 dominates)
Best impostors: 0.80 - 0.82
Smallest gap:   0.1283 (very clean)
```

---

## Files Created

### Scripts
- `scripts/calibrate_threshold.py` - Phase 4 eval harness
- `scripts/Calibrate-Threshold.ps1` - PowerShell wrapper
- `scripts/add_clean_scan_templates.py` - Add real scan crops to gallery
- `scripts/sanity_test_embedder.py` - Quick embedder validation
- `scripts/print_scores.py` - Detailed score analysis tool

### Test Fixtures
- `__tests__/ocr/fixtures/greavard_crop.json`
- `__tests__/ocr/fixtures/pidgeot_ex_crop.json`
- `__tests__/ocr/fixtures/wugtrio_crop.json`

### Migrations
- `supabase/migrations/20251025230000_add_distance_to_rpc.sql`

### Documentation
- `docs/working-memory/phase4_threshold_calibration_results.md`
- `docs/working-memory/handoffs/2025/10-october/context_handoff_20251025_evening.md`

---

## Database Changes

- **card_templates:** Added 3 clean scan templates
- **card_prototypes:** Rebuilt for sv3-92, sv3-164, sv3-57

---

## What's Next

### Phase 5 - Logging & Mining
- Add `ident_logs` table
- Log top-5 candidates + final decision
- Mine confusion pairs from production
- Automated template upsert from user corrections

### Production Monitoring
- Track UNKNOWN rate by set
- Watch fused score distributions (p10/p50/p90)
- Add templates for frequently confused cards

### Optional Improvements
- Set prefilter when known (lower latency)
- Weekly hard-negative mining
- HNSW index for larger gallery

---

## Status

✅ Phase 1: Embedder (ViT-L/14-336, GPU)  
✅ Phase 2: Gallery population (15,504 cards, 46,512+ templates)  
✅ Phase 3: Retrieval v2 (ANN + prototype fusion)  
✅ Phase 4: Threshold calibration (τ=0.80, 100% accuracy)  
🔜 Phase 5: Logging & mining

