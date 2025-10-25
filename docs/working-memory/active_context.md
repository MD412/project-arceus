# Active Context - Project Arceus

**Last Updated:** October 25, 2025 @ 11:00 PM  
**Branch:** `main`  
**Status:** ✅ Phase 4 Complete — Threshold calibrated (0.80), v2 deployed

---

## 🎯 Current Status

**Session Focus:** Phase 4 threshold calibration complete; v2 live with 100% accuracy

### Latest Session (Oct 25, 11:00 PM)
- ✅ Fixed domain gap (added clean scan templates)
- ✅ Achieved 100% P/R on test fixtures
- ✅ Set UNKNOWN_THRESHOLD=0.80 in production
- ✅ Worker redeployed to Render

**In Progress:**
- Worker deploying with calibrated threshold

---

## 📖 Quick Links

### Latest Handoff
- **📋 [Session: Phase 4 Complete (Oct 25, 11:00 PM)](./handoffs/2025/10-october/context_handoff_20251025_evening.md)** ← **Current session**

### Previous Handoffs
- **📋 [Vision Phase 2 running; v2 live (Oct 25, 9:30 PM)](./handoffs/2025/10-october/context_handoff_20251025_2130.md)**
- **📋 [Vision Phase 1 Complete (Oct 24, 5:30 PM)](./handoffs/2025/10-october/context_handoff_20251024_1730.md)**
- **📋 [Modal UI Improvements (Oct 23, 5:00 PM)](./handoffs/2025/10-october/context_handoff_20251023_1700.md)**

---

## 🔴 Top Priorities

### 1. Phase 5 — Logging & Mining
- Add `ident_logs` table; log top‑5 candidates + final decision
- Mine confusion pairs; build automated template upsert from user corrections
- Monitor production for false positives/negatives

### 2. Template Bank Growth
- Add more clean scan crops as templates (focus on problematic cards)
- Light augmentation: photometric + blur (avoid heavy distortion)
- Rebuild prototypes incrementally

### 3. Production Monitoring
- Watch for UNKNOWN rate (too high = threshold too strict)
- Track wrong IDs (adjust threshold or add templates)
- Collect real-world accuracy metrics

---

## 🔧 Technical State
- Retrieval v2 live with `UNKNOWN_THRESHOLD=0.80` (calibrated for ≥99% precision)
- Gallery: 15,504 cards, 46,512+ templates (incl. clean scans)
- Test accuracy: 100% on fixture set (clear score separation)
- Domain gap fixed: clean scan templates provide exact matches (1.0 similarity)

---

## 📊 Latest Session Summary
- See `./summaries/2025/10-october/session_summary_20251025.md`
