# Context Handoff for Next Session

**Date:** October 9, 2025  
**Branch:** `chore/system-mri-001`  
**Last Session:** System MRI + Worker Validation + Review UI Cleanup (6 hours)

---

## 🎯 Where We Left Off

Just completed a **6-hour System MRI** session. System is mapped, worker is validated, review UI is cleaned up. **Ready to fix the user_cards creation bug** and run live E2E tests.

---

## 📚 Must-Read Files (In Order)

1. **`NEXT_SESSION_BRIEF.md`** - Start here! Has your top 3 goals
2. **`SYSTEM_MAP.md`** - Complete architecture (§11 has today's findings)
3. **`TRIAGE_PLAN.md`** - Today's execution plan (reference for completed work)
4. **`logs/worker_status_20251009.md`** - Worker validation results

---

## 🔴 Top Priority: Fix user_cards Creation Bug

**Problem:** All 22 historical worker runs show `"user_cards_created": 0`

**Investigation Path:**
```typescript
// Files to examine:
1. worker/worker.py lines 83-160   // resolve_card_uuid() function
2. worker/worker.py lines 410-430  // user_cards creation logic
3. docs/database-schema.md         // card_keys table structure

// Questions to answer:
- Is card_keys table populated? (SELECT COUNT(*) FROM card_keys;)
- Does resolve_card_uuid() return UUIDs for external IDs like "sv8pt5-160"?
- Should worker create card_keys mappings on-the-fly?
```

**Sample Output to Debug:**
```json
{
  "scan_id": "f45d1d2b-3051-4c39-8f13-7d9339f923f2",
  "total_detections": 10,
  "user_cards_created": 0,  // <-- This should be > 0
  "detection_records": ["uuid1", "uuid2", ...]
}
```

---

## 🗃️ Database Schema (Critical Tables)

### `card_embeddings` (19k+ rows)
```sql
- card_id: text (external ID like "sv8pt5-160")
- embedding: vector(512)
- model_version: text
- image_url: text
```

### `cards` (stores card metadata)
```sql
- id: uuid (primary key)  // <-- Need this for user_cards
- name: text
- set_name: text
- collector_number: text
- image_url: text
```

### `card_keys` (mapping table)
```sql
- source: text (e.g., "pokemon_tcg_api")
- external_id: text (e.g., "sv8pt5-160")
- card_id: uuid (references cards.id)
- UNIQUE (source, external_id)
```

### `user_cards` (user's collection)
```sql
- id: uuid (primary key)
- user_id: uuid
- card_id: uuid (references cards.id)  // <-- Requires UUID, not external_id
- detection_id: uuid
- quantity: integer
- UNIQUE (user_id, card_id)
```

### `card_detections` (worker output)
```sql
- id: uuid (primary key)
- scan_id: uuid
- card_index: integer
- card_id: text (external ID from CLIP)  // <-- Problem: text not uuid
- card_name: text
- cropped_image_path: text
- identification_confidence: float
```

**KEY INSIGHT:** Worker identifies cards with external text IDs (e.g., "sv8pt5-160") but `user_cards` requires UUIDs. The `resolve_card_uuid()` function should bridge this gap via `card_keys` mapping table.

---

## 🏗️ Worker Architecture

### Processing Pipeline
```
1. Dequeue job from job_queue
2. Download image from Supabase Storage (scans bucket)
3. YOLO detection → find card bounding boxes
4. Crop detected cards
5. CLIP batch identification → match to card_embeddings (returns external IDs)
6. resolve_card_uuid(external_id) → lookup in card_keys → get UUID
7. Create card_detections records (with external text ID)
8. Create user_cards records (with UUID) <-- FAILING HERE
9. Generate summary image
10. Upload to Storage + update DB
```

### Key Functions
```python
# worker/worker.py

def resolve_card_uuid(supabase_client, source: str, external_card_id: str) -> Optional[str]:
    """
    Resolve external text card ID (e.g., sv8pt5-160) to internal cards.id (UUID).
    1) Try card_keys direct mapping
    2) Try cards table direct lookup
    3) Create card from card_embeddings if exists
    Returns UUID or None
    """
    # Lines 83-160 - investigate this logic

def run_normalized_pipeline(...):
    # Lines 410-430 - user_cards creation
    if resolved_uuid:  # <-- Is this ever truthy?
        user_card_data = {
            "user_id": user_id,
            "detection_id": detection_id,
            "card_id": resolved_uuid,  # <-- Needs UUID
            ...
        }
        supabase_client.from_("user_cards").upsert(user_card_data, ...)
```

---

## 🧪 Test Data Available

### Worker Output Logs (22 files)
```
worker/output/ee2951a5-6476-4a7d-9cb2-57482e1776b9_result.json
- Sample shows: 10 detections, 0 user_cards_created
- All 22 outputs have same pattern
```

### Test Images
```
test-raw_scan_images/
- 6 test images ready for upload
- Use for live E2E test
```

### Historical Scans
- Production DB has completed scans
- Use `/scans/review` UI to inspect

---

## 🛠️ Git Patterns (IMPORTANT)

**Always use `--no-pager` flag:**
```bash
git --no-pager status
git --no-pager log --oneline -5
git --no-pager diff --stat
git --no-pager add <files>
git --no-pager commit -m "message"
```

**Why:** Git's pager blocks terminal indefinitely in automation. This was the root cause of terminal hangs today.

---

## 📁 Project Structure (Key Directories)

```
project-arceus/
├── app/
│   ├── (app)/
│   │   ├── page.tsx                    # Landing/Dashboard
│   │   ├── scan-upload/                # Upload interface
│   │   └── scans/
│   │       ├── review/page.tsx         # 🎯 Review inbox (cleaned up today)
│   │       └── [id]/page.tsx           # Individual scan detail
│   ├── api/
│   │   ├── scans/                      # Scan CRUD + job mgmt
│   │   ├── detections/                 # Detection correction
│   │   └── user-cards/                 # Collection management
│   └── globals.css                     # Design system tokens
│
├── components/
│   ├── scan-review/                    # 🎯 Domain components (cleaned up)
│   │   ├── ScanReviewShell.tsx        # ✅ Single source of truth
│   │   ├── InboxSidebar.tsx
│   │   ├── DetectionGrid.tsx
│   │   └── CorrectionModal.tsx
│   └── ui/                             # Generic reusable components
│
├── worker/                             # 🎯 Python processing
│   ├── worker.py                       # Main pipeline (621 lines)
│   ├── clip_lookup.py                  # CLIP identification
│   ├── config.py                       # Supabase client
│   └── output/                         # 22 historical run logs
│
├── hooks/
│   ├── useReviewInbox.ts               # Review inbox state
│   ├── useScan.ts                      # Individual scan fetch
│   └── useDetections.ts                # Detection management
│
├── docs/
│   ├── database-schema.md              # 📚 DB schema reference
│   └── api-endpoints.md                # API contracts
│
└── supabase/
    └── migrations/                     # 50+ DB migrations
```

---

## 🔧 Environment Setup

### Required Env Vars (in `.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### Worker Startup
```bash
cd worker
python worker.py 2>&1 | Tee-Object -FilePath ../logs/worker_live_run.txt
```

### Frontend
```bash
npm run dev  # localhost:3000
```

---

## 🎨 Design System (CircuitDS)

- **CSS Modules** (no Tailwind)
- **Global tokens** in `app/globals.css`
- **Documentation** at `/circuitds`
- **Convention:** `ComponentName.module.css` + `ComponentName.tsx`

---

## ✅ What's Already Done (Don't Redo)

- ✅ Worker has env validation and stage-by-stage logging
- ✅ Worker validated with 22 historical successful runs
- ✅ Review UI cleanup complete (duplicates removed)
- ✅ ScanReviewShell has TypeScript types + JSDoc
- ✅ System architecture fully documented (SYSTEM_MAP.md)
- ✅ Next session plan created (NEXT_SESSION_BRIEF.md)

---

## 🚫 Explicitly Deferred (Don't Touch)

- ❌ Trace ID propagation
- ❌ Search component consolidation
- ❌ Model version tracking
- ❌ Performance profiling
- ❌ Observability infrastructure

**Focus:** Fix user_cards bug, then run live E2E test. Everything else waits.

---

## 🎯 Session Goals (Copy to New Chat)

```
Hi! Continuing from yesterday's System MRI session. 

Context: Just completed 6-hour system analysis. Worker is validated, 
review UI is clean, but found a bug: user_cards_created = 0 in all 
historical runs.

Top 3 goals for today:
1. Fix user_cards creation bug (investigate resolve_card_uuid)
2. Run live E2E worker test with new logging
3. Add unique constraint on detections for safety

Please read:
- NEXT_SESSION_BRIEF.md (action items)
- SYSTEM_MAP.md §11 (yesterday's findings)
- worker/worker.py lines 83-160 and 410-430

Start by investigating: Why does resolve_card_uuid() fail to return UUIDs?
Is card_keys table populated?
```

---

## 💡 Key Patterns to Follow

### When Investigating Code
1. Use `codebase_search` for semantic understanding
2. Use `grep` for exact text matches
3. Use `read_file` with offset/limit for large files
4. Always check DB schema in `docs/database-schema.md`

### When Using Git
1. **Always** use `--no-pager` flag
2. Commit frequently with clear messages
3. Stage specific files, not `git add -A` unless intentional

### When Running Worker
1. Check env vars first
2. Use `2>&1 | Tee-Object` to capture logs
3. Monitor console for `[OK]` stage markers
4. Check `worker/output/` for result JSON

---

## 🔍 Debugging Commands

### Check card_keys Population
```sql
SELECT COUNT(*) FROM card_keys;
SELECT * FROM card_keys LIMIT 5;
SELECT * FROM card_keys WHERE external_id = 'sv8pt5-160';
```

### Check User Cards
```sql
SELECT COUNT(*) FROM user_cards;
SELECT * FROM user_cards WHERE user_id = '<test-user-id>';
```

### Check Recent Detections
```sql
SELECT 
  cd.card_id,
  cd.card_name,
  c.id as cards_uuid
FROM card_detections cd
LEFT JOIN cards c ON c.id::text = cd.card_id
LIMIT 10;
```

---

## 📊 Success Metrics for Next Session

- ✅ Understand why resolve_card_uuid() returns None
- ✅ Fix the UUID mapping logic
- ✅ One live worker run shows `user_cards_created > 0`
- ✅ E2E test passes: upload → detect → collection
- ✅ Unique constraint added to detections

---

**Ready to go!** Copy the "Session Goals" section into your next chat, and it'll have everything it needs to continue seamlessly. 🚀

