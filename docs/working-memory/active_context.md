# Active Context - Project Arceus

**Last Updated:** October 28, 2025 @ 6:00 PM  
**Branch:** `main`  
**Status:** 🔄 Worker fix deployed to Render, awaiting fresh scan test

---

## 🎯 Current Status

**Session Focus:** Fixed detection display + worker issues; cleaned legacy database tables

### Latest Session (Oct 28, 6:00 PM)
- ✅ Fixed Git Guardian security alert (.cursor/ token leak)
- ✅ Fixed scan titles (UUIDs) and card count display (RLS bypass)
- ✅ Discovered root cause: Phase 5a migration cascaded October detections
- ✅ Cleaned legacy tables (scan_images, scan_batches, user_card_instances)
- ✅ Fixed worker duplicate constraint error (upsert fix)
- 🔄 Render deployment in progress

**Ready for:**
- Fresh scan upload test after Render deployment completes

---

## 📖 Quick Links

### Latest Handoff
- **📋 [Session: Worker Fix & Database Cleanup (Oct 28, 6:00 PM)](./handoffs/2025/10-october/context_handoff_20251028_1800.md)** ← **Latest**

### Previous Handoffs
- **📋 [Phase 5a Implementation Complete (Oct 27, 5:00 PM)](./handoffs/2025/10-october/context_handoff_20251027_1700.md)**
- **📋 [Worker v2 Fixed, Phase 5 Defined (Oct 26, 1:00 AM)](./handoffs/2025/10-october/context_handoff_20251026_0100.md)**
- **📋 [Vision Phase 2 running; v2 live (Oct 25, 9:30 PM)](./handoffs/2025/10-october/context_handoff_20251025_2130.md)**
- **📋 [Vision Phase 1 Complete (Oct 24, 5:30 PM)](./handoffs/2025/10-october/context_handoff_20251024_1730.md)**
- **📋 [Modal UI Improvements (Oct 23, 5:00 PM)](./handoffs/2025/10-october/context_handoff_20251023_1700.md)**

---

## 🔴 Top Priorities

### 1. Test Worker Fix (IMMEDIATE)
- Wait for Render deployment to complete
- Upload fresh scan → verify detections created
- Check `card_detections` and `training_feedback` tables
- Confirm frontend displays cards correctly

### 2. Phase 5b — Auto-Learning (Next Feature)
- Background job to process pending corrections
- Auto-add high-confidence corrections as templates
- Rebuild prototypes incrementally

### 3. Template Bank Growth
- Add more clean scan crops as templates (focus on problematic cards)
- Light augmentation: photometric + blur (avoid heavy distortion)
- Rebuild prototypes incrementally

### 4. Production Monitoring
- Watch for UNKNOWN rate (too high = threshold too strict)
- Track wrong IDs (adjust threshold or add templates)
- Collect real-world accuracy metrics

---

## 🔧 Technical State
- Retrieval v2 live with `UNKNOWN_THRESHOLD=0.80` (calibrated for ≥99% precision)
- Gallery: 15,504 cards, 46,512+ templates (incl. clean scans)
- Test accuracy: 100% on fixture set (clear score separation)
- Domain gap fixed: clean scan templates provide exact matches (1.0 similarity)
- **Phase 5a deployed:** `training_feedback` table + worker logging + correction API
- **Database cleaned:** Legacy tables removed, active system uses `scans` + `card_detections` only
- **Worker fix deployed:** Upsert instead of INSERT (fixes duplicate constraint issue)

---

## 📊 Latest Session Summary
- See `./handoffs/2025/10-october/context_handoff_20251028_1800.md`
