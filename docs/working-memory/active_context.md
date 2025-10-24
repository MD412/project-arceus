# Active Context - Project Arceus

**Last Updated:** October 24, 2025 @ 5:30 PM  
**Branch:** `main`  
**Status:** ✅ Modified - Phase 1 (OpenCLIP ViT-L/14-336 embedder) complete

---

## 🎯 Current Status

**Session Focus:** AI Vision upgrade (Phase 1: backbone + preprocessing)

### Latest Session (Oct 24, 5:30 PM) - Phase 1 Complete
- ✅ Added ViT-L/14-336 embedder with strict transforms and TTA(2)
- ✅ Pinned deps; added flags; created smoke tests (passed on CPU)

### Combined Status from All Sessions

**Shipped Features:**
- Minimal header design
- Teal theme for interactive elements
- Set name display (38,822 rows backfilled)
- Modal UX fixes (stays open on replace)
- Rarity support (backend + frontend)
- Responsive image scaling (scan tab)
- Collection filter improvements
- Sidebar defaults to minimized
- ✅ OpenCLIP ViT-L/14-336 embedder with strict preprocessing and TTA(2)

**In Progress:**
- AI Vision Phase 2 planning (schemas + population)

**Deferred:**
- Language support (infrastructure exists, UI shelved)

---

## 📖 Quick Links

### Latest Handoff
- **📋 [Session: Vision Phase 1 Complete (Oct 24, 5:30 PM)](./handoffs/2025/10-october/context_handoff_20251024_1730.md)** ← **Current session**

### Previous Handoffs
- **📋 [Session: Modal UI Improvements (Oct 23, 5:00 PM)](./handoffs/2025/10-october/context_handoff_20251023_1700.md)**
- **📋 [Session: UI Polish (Oct 21, 4:00 PM)](./handoffs/2025/10-october/context_handoff_20251021_1600.md)**
- **📋 [Session A: Language Foundation (Oct 21, 12:00 AM)](./handoffs/2025/10-october/context_handoff_20251021_0000.md)**
- **📋 [Session B: Modal + Rarity (Oct 20, 4:00 AM)](./handoffs/2025/10-october/context_handoff_20251020_0400.md)**

### Supporting Docs
- **📋 [UI Minimalism Summary](./summaries/2025/10-october/session_summary_20251021_ui_minimal.md)**
- **📋 [UI Polish Session Summary](./summaries/2025/10-october/session_summary_20251021_ui_polish.md)**
- **📋 [Session A Summary](./summaries/2025/10-october/session_summary_20251020_extended.md)**
- **📋 [Session B Summary](./summaries/2025/10-october/session_summary_20251021_parallel.md)**
- **📋 [Japanese Card Support Plan](./japanese-card-support-plan.md)**
- **📋 [CSS Debugging Protocol](./css-debugging-protocol.md)**
- **📂 [Organization Guide](./ORGANIZATION.md)**
- **⌨️ [Commands](./COMMAND_REFERENCE.md)**

> Forward-looking priorities live in the latest handoff's "What's Next."

---

## 🔴 Top Priorities

### 1. Vision Phase 2 — Gallery Schemas + Population
**Status:** Ready to implement  
**Tasks:**
- Create `card_templates` (vector(768), cosine; HNSW default; metadata: set_id, variant, source, aug_tag)
- Create `card_prototypes` (vector(768), cosine; mean of templates, template_count)
- Populate with 2–3 templates/card using ViT-L/14-336

**Impact:** Enables robust retrieval and prototype fusion

**Files:** SQL migration + population scripts

### 2. Vision Phase 3 — Retrieval + Thresholding
**Status:** Next after Phase 2  
**Tasks:**
- Query TTA(2) → ANN top-K → prototype fusion (0.7/0.3) → unknown τ gate
- Optional set_id prefilter; optional k-reciprocal re-rank

**Impact:** High-precision card identification on real photos

### 3. UI Polish and Deferred Items
**Status:** Deferred unless prioritized by user

---

## 🔧 Technical State

### ✅ Working Systems
- All previous UI improvements (see prior sessions)
- ViT-L/14-336 embedder: deterministic, L2-normalized, CPU-validated

### ⚠️ Needs Testing
- None for Phase 1 (smoke passed)

### 🚨 Known Issues
- None related to Phase 1; initial model download (~1.7GB) expected once

---

## 💡 Key Insights
- Identification accuracy hinges on gallery design + retrieval; backbone and strict preprocessing now in place for Phase 2/3

---

## 📊 Latest Session Summary
- See `./summaries/2025/10-october/session_summary_20251024.md`
