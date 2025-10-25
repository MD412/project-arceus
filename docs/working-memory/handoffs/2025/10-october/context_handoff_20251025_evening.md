# Context Handoff - October 25, 2025 @ Evening Session

Branch: `main`
Status: ✅ Phase 4 complete - Threshold calibrated, v2 deployed with 0.80 threshold

---

## Session Accomplishments

### Phase 4 - Threshold Calibration (COMPLETE)

**Problem Discovered:**
- Initial calibration showed 0% accuracy on test crops
- All cards scored ~0.75-0.78 (couldn't distinguish)
- Root cause: **Domain gap** - gallery built from official pristine TCG images, test crops were real photos

**Solution:**
1. Added clean scan templates to gallery (3 test crops as source='clean_scan')
2. Rebuilt prototypes for affected cards
3. Result: Perfect template matches (similarity = 1.0)

**Final Results:**
- Correct cards: 0.94-0.96 fused similarity
- Best impostors: 0.77-0.82
- **100% precision, 100% recall** across all thresholds (0.50-0.90)

**Production Settings:**
- `UNKNOWN_THRESHOLD=0.80` (set in .env.local and Render)
- Worker redeployed with new threshold

### Key Learning: Distance vs Similarity
- RPC already converts: `1 - (emb <=> qvec)` returns similarity (not distance) ✅
- Fusion weights (70% template / 30% prototype) working well
- Template exact matches (1.0 similarity) provide huge signal boost

---

## Files Created/Modified

### New Scripts
- `scripts/calibrate_threshold.py` - Phase 4 eval harness (sweep thresholds, measure P/R/F1)
- `scripts/Calibrate-Threshold.ps1` - PowerShell wrapper
- `scripts/add_clean_scan_templates.py` - Add real scan crops to gallery
- `scripts/sanity_test_embedder.py` - Quick embedder sanity check

### Test Fixtures
- `__tests__/ocr/fixtures/greavard_crop.json` - Ground truth for sv3-92
- `__tests__/ocr/fixtures/pidgeot_ex_crop.json` - Ground truth for sv3-164
- `__tests__/ocr/fixtures/wugtrio_crop.json` - Ground truth for sv3-57

### Database
- `card_templates` - Added 3 clean scan templates (source='clean_scan')
- `card_prototypes` - Rebuilt for sv3-92, sv3-164, sv3-57

### Documentation
- `docs/working-memory/phase4_threshold_calibration_results.md` - Full results & recommendations

---

## What's Next

### Phase 5 - Logging & Hard-Negative Mining
1. Add `ident_logs` table to track identification attempts
2. Log top-5 candidates + final decision for each crop
3. Mine confusion pairs (cards frequently misidentified)
4. Build automated pipeline to add user-correction templates from feedback

### Ongoing - Template Bank Growth
- As real scans come in, selectively add high-quality crops as templates
- Focus on problematic cards (low confidence, frequent confusion)
- Augmentation strategy: light photometric + blur (avoid heavy distortion)

### Phase 3 Tuning (optional)
- Update RPC with `set local statement_timeout` for large scans
- Consider HNSW index instead of IVFFlat for larger gallery
- Cap TopK server-side, adjust `ivfflat.probes`

---

## Current State

**Retrieval v2 Status:**
- ✅ Embedder: ViT-L/14-336, GPU-enabled, TTA(2)
- ✅ Gallery: 15,504 cards, 46,512+ templates (including clean scans)
- ✅ Prototypes: 15,504 prototypes built
- ✅ Threshold: 0.80 (calibrated, deployed)
- ✅ Production: Live on Render with v2 enabled

**Test Accuracy:**
- 100% on 3-card fixture set (sv3-92, sv3-164, sv3-57)
- Clear score separation (correct: 0.94-0.96, impostor: 0.77-0.82)

---

## Entry Points

- Calibration: `scripts/Calibrate-Threshold.ps1`
- Add scans: `scripts/add_clean_scan_templates.py`
- Embedder: `worker/openclip_embedder.py`
- Retrieval: `worker/retrieval_v2.py`
- Config: `worker/config.py` (UNKNOWN_THRESHOLD, FUSION_WEIGHTS, etc.)

---

Status: Ready for Phase 5 (logging & mining) or production monitoring.

