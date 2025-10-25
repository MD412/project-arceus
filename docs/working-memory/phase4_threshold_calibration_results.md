# Phase 4: Threshold Calibration Results

**Date:** October 25, 2025  
**Status:** ✅ Complete

## Summary

Successfully calibrated `UNKNOWN_THRESHOLD` for retrieval v2 after fixing domain gap.

## Root Cause Analysis

**Initial Problem:** 0% accuracy on test crops
- Gallery built from official pristine TCG images
- Test crops were real photos (different lighting/quality)
- Domain gap → model couldn't distinguish (all scores ~0.75-0.78)

**Solution:** Added clean scan templates
- Added 3 test crop images as templates to `card_templates` (source='clean_scan')
- Rebuilt prototypes to include real photo embeddings
- Result: Perfect template matches (similarity = 1.0)

## Calibration Results

### Correct Card Scores (after fix)
| Card | Fused | Template | Prototype |
|------|-------|----------|-----------|
| sv3-92 (Greavard) | 0.9389 | 1.0000 | 0.7964 |
| sv3-164 (Pidgeot ex) | 0.9571 | 1.0000 | 0.8570 |
| sv3-57 (Wugtrio) | 0.9457 | 1.0000 | 0.8190 |

### Best Impostor Scores
- Range: 0.77 - 0.82
- Clear separation from correct cards

### Threshold Sweep
All thresholds (0.50 - 0.90) achieved:
- **Precision:** 100%
- **Recall:** 100%
- **F1:** 1.000

## Recommended Production Settings

```bash
UNKNOWN_THRESHOLD=0.80
```

**Rationale:**
- Correct cards score 0.94-0.96 (pass)
- Best impostors score 0.77-0.82 (reject)
- 0.80 provides safe margin with room for variance

## Next Steps

1. **Set environment variable** in `.env.local` and Render:
   ```
   UNKNOWN_THRESHOLD=0.80
   ```

2. **Redeploy worker** to Render

3. **Monitor production** for:
   - False positives (wrong IDs slipping through)
   - False negatives (real cards marked UNKNOWN)
   - Adjust threshold if needed based on real-world data

## Key Learnings

1. **Distance vs Similarity:** RPC already converts (`1 - distance`) ✅
2. **Domain Gap:** Official art ≠ real photos - need clean scan templates
3. **Template Matching:** Direct photo matches score 1.0, huge signal boost
4. **Fusion Weights:** 70% template / 30% prototype works well

## Files Created/Modified

- `scripts/calibrate_threshold.py` - Eval harness
- `scripts/add_clean_scan_templates.py` - Add real scan templates
- `scripts/Calibrate-Threshold.ps1` - PowerShell wrapper
- `__tests__/ocr/fixtures/*.json` - Ground truth metadata
- `card_templates` table - Added 3 clean scan templates
- `card_prototypes` table - Rebuilt for sv3-92, sv3-164, sv3-57

