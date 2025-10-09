# Next Session Brief - Project Arceus

**Created:** October 9, 2025  
**For:** Next coding session  
**Context:** Post-system MRI + worker validation + review UI cleanup

---

## 🎯 Session Goals (Top 3)

### 1. Fix user_cards Creation Bug 🔴 HIGH PRIORITY
**Problem:** All 22 historical worker outputs show `"user_cards_created": 0`  
**Impact:** Users can't build their collection despite successful card detection

**Investigation Steps:**
1. Read `worker/worker.py` lines 410-430 (user_cards creation logic)
2. Check `resolve_card_uuid()` function - is it returning UUIDs?
3. Query `card_keys` table - is it populated with mappings?
4. Test with one known card: `sv8pt5-160` → should map to UUID
5. Add debug logging: print resolved UUID before user_cards insert

**Success Criteria:**
- ✅ Understand why UUID resolution fails
- ✅ Fix the mapping or fallback logic
- ✅ Test: upload scan → verify user_cards row created
- ✅ Confirm `user_cards_created > 0` in output log

---

### 2. Live End-to-End Worker Test 🟡 MEDIUM PRIORITY
**Goal:** Validate new logging improvements with real-time execution

**Test Plan:**
1. Start worker: `cd worker && python worker.py 2>&1 | Tee-Object -FilePath ../logs/worker_live_run.txt`
2. Upload test image via `/scan-upload` (use existing test images in `test-raw_scan_images/`)
3. Watch console for stage markers:
   - `[OK] Environment loaded`
   - `[OK] YOLO model loaded`
   - `[OK] Supabase connected`
   - `[OK] CLIP identifier initialized`
   - `[OK] Job dequeued`
   - `[OK] Detection complete: N cards found`
   - `[OK] Identifications complete`
   - `[OK] Results uploaded`
   - `[OK] Job finalized`
4. Query DB to confirm detections written
5. Check `/scans/review` UI - should show new scan

**Success Criteria:**
- ✅ All stage markers appear in correct order
- ✅ No errors/exceptions in console
- ✅ Detections appear in DB
- ✅ Scan appears in review UI
- ✅ Log captured in `logs/worker_live_run.txt`

---

### 3. Add Critical Safety Net 🟢 LOW PRIORITY
**Goal:** Prevent duplicate detections on job retry

**Implementation:**
```sql
-- Add unique constraint
ALTER TABLE card_detections 
ADD CONSTRAINT unique_detection_per_scan 
UNIQUE (scan_id, card_index);
```

**Success Criteria:**
- ✅ Migration created in `supabase/migrations/`
- ✅ Applied to production DB
- ✅ Test: retry same job → no duplicate detections

---

## 📋 Quick Wins (If Time Permits)

### 4. Add Health Check Endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected', // test with simple query
      storage: 'connected'   // test with bucket list
    }
  });
}
```

### 5. Document card_keys Population
- When/how are card_keys populated?
- Is there a backfill script?
- Should worker create mappings on-the-fly?

---

## 🚫 Explicitly Deferred (Don't Touch)

- ❌ Trace ID propagation (premature optimization)
- ❌ Search component consolidation (not on critical path)
- ❌ Model version tracking (nice-to-have, not urgent)
- ❌ Performance profiling (optimize after it's working 100%)

---

## 📚 Key Files to Read First

**Worker Pipeline:**
- `worker/worker.py` lines 410-430 (user_cards logic)
- `worker/worker.py` lines 83-160 (resolve_card_uuid function)
- `worker/clip_lookup.py` (CLIP identification)

**Database:**
- `docs/database-schema.md` (card_keys table structure)
- `supabase/migrations/` (check if card_keys migration exists)

**API Routes:**
- `app/api/scans/bulk/route.ts` (upload endpoint)
- `app/api/scans/review/route.ts` (review inbox data)

---

## 🔧 Environment Setup Checklist

Before starting:
- [ ] Worker environment vars present (check `.env.local`)
- [ ] Test images ready in `test-raw_scan_images/`
- [ ] Supabase connection working (quick `SELECT 1` test)
- [ ] Git branch clean: `git status`
- [ ] Previous commits pushed if needed

---

## 📊 Expected Outcomes

**Minimum Success:**
- ✅ Understand user_cards creation bug
- ✅ One successful live worker run logged

**Ideal Success:**
- ✅ user_cards bug fixed and tested
- ✅ Live E2E test passes (upload → detection → review → collection)
- ✅ Unique constraint added for safety
- ✅ Documentation updated with findings

**Stretch Goals:**
- ✅ Health check endpoint added
- ✅ card_keys population documented
- ✅ Performance baseline captured (time per stage)

---

## 🎓 Lessons from Today

1. **Always use `git --no-pager`** for automated commands to avoid terminal hangs
2. **Historical evidence is powerful** - 22 output logs validated worker without live test
3. **System mapping first** - SYSTEM_MAP.md kept us focused and prevented scope creep
4. **Triage ruthlessly** - Explicitly deferring low-priority items saved hours

---

## 📞 Questions to Answer

1. Why does `user_cards_created` = 0 in all historical runs?
2. Is `card_keys` table populated? How/when?
3. Does `resolve_card_uuid()` work for external card IDs like `sv8pt5-160`?
4. Should worker create card_keys mappings on-the-fly or expect pre-population?

---

## 🚀 Start Here Tomorrow

```bash
# 1. Review this brief
# 2. Read worker/worker.py lines 83-160 and 410-430
# 3. Query card_keys table: SELECT COUNT(*) FROM card_keys;
# 4. Start investigation from there
```

**Estimated Time:** 2-3 hours for goals 1-2, +1 hour for goal 3

---

**Good luck!** You have a stable foundation. Now make the collection feature actually work. 💪

