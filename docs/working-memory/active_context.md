# Active Context - Project Arceus

**Last Updated:** October 26, 2025 @ 1:00 AM  
**Branch:** `main`  
**Status:** ✅ Retrieval v2 fixed — User's scan working; Phase 5 roadmap defined

---

## 🎯 Current Status

**Session Focus:** Retrieval v2 working with real scans; Phase 5 learning system designed

### Latest Session (Oct 26, 1:00 AM)
- ✅ Fixed worker to use retrieval v2 (was hardcoded to legacy)
- ✅ Added user's actual Greavard scan as template
- ✅ Achieved 0.9592 score on user's real scan
- ✅ Defined simplified Phase 5 with single `training_feedback` table

**Ready for:**
- Phase 5a implementation (training feedback table)

---

## 📖 Quick Links

### Latest Handoff
- **📋 [Session: Worker v2 Fixed, Phase 5 Defined (Oct 26, 1:00 AM)](./handoffs/2025/10-october/context_handoff_20251026_0100.md)** ← **Latest**

### Previous Handoffs
- **📋 [Vision Phase 2 running; v2 live (Oct 25, 9:30 PM)](./handoffs/2025/10-october/context_handoff_20251025_2130.md)**
- **📋 [Vision Phase 1 Complete (Oct 24, 5:30 PM)](./handoffs/2025/10-october/context_handoff_20251024_1730.md)**
- **📋 [Modal UI Improvements (Oct 23, 5:00 PM)](./handoffs/2025/10-october/context_handoff_20251023_1700.md)**

---

## 🔴 Top Priorities

### 1. Phase 5a — Training Feedback Table
- Create single `training_feedback` table as source of truth
- Log every identification: crop, prediction, correction, status
- Track quality issues (blur, glare, angle) for analysis

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
