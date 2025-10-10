# Arceus Triage Plan — Oct 9, 2025

## 🎯 Today's Battlefront (Freeze Everything Else)

**Two targets only:**
1. **Worker local boot** → Input to output with clear logs ✅
2. **ReviewPanel cleanup** → Single source of truth for review UI ✅

**All other problems are deferred until after successful test of worker + review flow.**

---

## 📊 Pain Node Triage (from SYSTEM_MAP §6)

| Issue | Severity | Complexity | Decision |
|-------|----------|------------|----------|
| 🔴 Review UI complexity | HIGH | 🧱 Code surgery (>2h) | **TODAY (Target 2)** |
| 🟡 Worker ↔ DB connectivity | MEDIUM | 🩹 Quick patch (<1h) | **TODAY (Target 1)** |
| 🟡 Idempotency gaps | MEDIUM | 🧱 Code surgery (>2h) | 💤 DEFER (needs migration) |
| 🟢 Search UX coupling | LOW | 🧱 Code surgery (>2h) | 💤 DEFER (not critical) |

---

## ✅ Micro-Tickets (Hours 3-6)

### 🎯 Target 1: Worker Stabilization (Hours 3-4)

**Goal:** Prove worker can process one job end-to-end with clear observability.

- [ ] **W1:** Verify `.env` vars load on startup; log warning if missing
  - File: `worker/worker.py` (lines 1-40)
  - Add startup health check function
  - Print `[OK] Environment loaded` or `[ERROR] Missing: SUPABASE_URL`

- [ ] **W2:** Add stage-by-stage logging to worker
  - Add `print(f"[OK] {stage}")` for each major step:
    - `[OK] YOLO model loaded`
    - `[OK] CLIP identifier initialized`
    - `[OK] Supabase connected`
    - `[OK] Job dequeued: {job_id}`
    - `[OK] Image downloaded: {storage_path}`
    - `[OK] Detection complete: {n} cards found`
    - `[OK] Identifications complete`
    - `[OK] Results uploaded`
    - `[OK] Job finalized`

- [ ] **W3:** Run local job → confirm detections written
  - Start worker: `cd worker && python worker.py`
  - Upload test image via `/scan-upload`
  - Watch console logs
  - Verify detections appear in DB (query `detections` table)

- [ ] **W4:** Capture & commit run log
  - Save console output → `logs/worker_run_20251009.txt`
  - Commit: `git add logs/ && git commit -m "logs: worker run validation"`

---

### 🎨 Target 2: Review UI Cleanup (Hour 5)

**Goal:** Single, clean component for review interface.

- [ ] **R1:** Identify & remove duplicate components
  - Audit: `ScanReviewModal.tsx`, `ScanReviewLayout.tsx`, `StreamlinedScanReview.tsx`
  - Decision: Keep `ScanReviewShell.tsx` as single source of truth
  - Action: Delete or move duplicates to `_archive/` folder

- [ ] **R2:** Ensure `/scans/review` renders via `ScanReviewShell` only
  - File: `app/(app)/scans/review/page.tsx`
  - Verify imports point to `ScanReviewShell`
  - Remove any conditional rendering of alternative components

- [ ] **R3:** Clean up `ScanReviewShell.tsx`
  - Add TypeScript interface for props (if missing)
  - Remove commented code blocks
  - Add JSDoc comments for main component
  - Ensure all child components properly typed

- [ ] **R4:** Test: approve one detection → reflected in DB
  - Navigate to `/scans/review`
  - Select scan, view detections
  - Click approve on one card
  - Query `user_cards` table to confirm insertion
  - Check console for errors

---

### 📝 Target 3: Documentation (Hour 6)

- [ ] **D1:** Update `SYSTEM_MAP.md` with findings
  - Append new §11: "Today's Findings"
  - Document worker bottlenecks discovered
  - Document UI simplification decisions
  - List next immediate blockers

- [ ] **D2:** Create sprint brief for tomorrow
  - Based on blockers found today
  - Prioritize top 3 items for next session

---

## ⏰ Time Allocation

| Time | Focus | Deliverable |
|------|-------|-------------|
| **Hour 3-4** | Worker reboot & validation | Working local worker with logs |
| **Hour 5** | Review UI cleanup | Single `ScanReviewShell` component |
| **Hour 6** | Debrief & commit | Updated docs + clean git history |

---

## 🚫 Explicitly Frozen (Do NOT Touch Today)

- ❌ Idempotency key implementation (requires migration)
- ❌ Search component consolidation (not critical path)
- ❌ API route refactoring (works as-is)
- ❌ Model version tracking (nice-to-have)
- ❌ Observability/tracing infrastructure (premature)
- ❌ Performance optimization (optimize after it works)
- ❌ E2E test suite expansion (one manual test is enough)

**Mantra:** "Make it work, make it right, make it fast" — we're on step 1.

---

## 🎯 Success Criteria (End of Day)

1. ✅ Worker processes one scan locally without crashes
2. ✅ Clear logs show each processing stage
3. ✅ Review UI works via single component
4. ✅ One manual E2E test passes: upload → process → review → approve
5. ✅ All changes committed with clean messages
6. ✅ SYSTEM_MAP.md updated with "what actually happened"

---

## 📋 Deferred to Next Session

- Add `model_version` to `detections` table
- Implement idempotency keys on critical mutations
- Add unique constraint: `detections (scan_id, card_index)`
- Consolidate duplicate search components
- Add trace_id propagation (frontend → API → worker)
- Set up structured logging (JSON format)
- Vector index performance analysis

---

**Generated:** October 9, 2025, 10:15 AM  
**Scope:** Worker + Review UI only  
**Estimated Effort:** 4 hours (Hr 3-6)  
**Next Review:** End of Hour 6 (debrief)

