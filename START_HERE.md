# 🚀 Start Here - Project Arceus

**Quick navigation for returning to this project.**

---

## 📍 Where Am I?

**Last Session:** October 9, 2025 (6 hours - System MRI complete)  
**Branch:** `chore/system-mri-001`  
**Status:** ✅ Worker validated, Review UI cleaned, Bug identified

---

## 🎯 Jump In Fast

### Quick Commands (Recommended)
```
/start session          ← Loads context automatically
/end session           ← Saves everything when done
/checkpoint [label]    ← Snapshot before risky changes
```

**See:** `docs/working-memory/COMMAND_REFERENCE.md` for details

### For Next Coding Session (Manual)
```bash
# 1. Read the latest context
cat docs/working-memory/active_context.md

# 2. See what's next
cat docs/working-memory/NEXT_SESSION_BRIEF.md

# 3. Start coding!
```

### For New AI Chat
**Option 1 (Quick):**
```
/start session
```

**Option 2 (Manual):**
```
Hi! Continuing Project Arceus from last session.

Read: docs/working-memory/active_context.md

Top priority: Fix user_cards creation bug (returns 0 in all runs).
Investigate: worker/worker.py lines 83-160 (resolve_card_uuid function)

Start by checking if card_keys table is populated.
```

---

## 📚 Documentation Index

### Living Memory (Session-to-Session Continuity)
- **`docs/working-memory/COMMAND_REFERENCE.md`** ← 🎮 /start, /end, /checkpoint commands
- **`docs/working-memory/active_context.md`** ← Start here (current state + priorities)
- **`docs/working-memory/README.md`** ← How the memory system works
- **`docs/working-memory/ORGANIZATION.md`** ← Folder structure guide
- **`docs/working-memory/handoffs/`** ← Session records (with "What's Next" sections)

### Architecture & Planning
- **`SYSTEM_MAP.md`** ← Complete system architecture (463 lines)
- **`docs/database-schema.md`** ← Database tables and relationships
- **`docs/api-endpoints.md`** ← API contracts

### Logs & Status
- **`logs/worker_status_20251009.md`** ← Worker validation results

---

## 🗂️ Project Structure

```
project-arceus/
├── START_HERE.md              ← You are here
├── SYSTEM_MAP.md              ← Architecture overview
│
├── docs/
│   ├── working-memory/        ← 🧠 Session context & continuity
│   │   ├── active_context.md       # Latest handoff (start here!)
│   │   ├── NEXT_SESSION_BRIEF.md   # Today's goals
│   │   ├── README.md               # How the memory system works
│   │   └── *.md                    # Timestamped session history
│   │
│   ├── database-schema.md     ← DB reference
│   └── api-endpoints.md       ← API contracts
│
├── app/                       ← Next.js frontend
├── components/                ← React components
├── worker/                    ← Python processing pipeline
├── hooks/                     ← React hooks
└── supabase/                  ← Database migrations
```

---

## 🔴 Current Priority

**Bug:** `user_cards_created = 0` in all 22 historical worker runs

**Why it matters:** Users can't build their collection despite successful card detection.

**Investigation:**
1. Check if `card_keys` table is populated
2. Debug `resolve_card_uuid()` function
3. Test UUID mapping for known cards

**Expected outcome:** Fix mapping logic → user_cards created successfully

---

## ⚡ Quick Commands

### Development
```bash
# Frontend
npm run dev                    # http://localhost:3000

# Worker
cd worker && python worker.py

# Tests
npm test                       # Jest unit tests
npm run test:e2e              # Playwright E2E
```

### Git (Always use --no-pager!)
```bash
git --no-pager status
git --no-pager log --oneline -5
git --no-pager diff --stat
```

### Database
```sql
-- Check card_keys population
SELECT COUNT(*) FROM card_keys;

-- Check user cards
SELECT COUNT(*) FROM user_cards;

-- Recent detections
SELECT card_id, card_name FROM card_detections 
ORDER BY created_at DESC LIMIT 10;
```

---

## 🎨 Design System

- **Framework:** Next.js 15 + React 19
- **Styling:** CSS Modules (no Tailwind)
- **Tokens:** `app/globals.css`
- **Documentation:** `/circuitds` route

---

## 🧪 Test Data

**Worker Output Logs:** `worker/output/*.json` (22 files)  
**Test Images:** `test-raw_scan_images/` (6 images)  
**Sample Scan ID:** Check latest in `worker/output/`

---

## 💡 Key Patterns

1. **Git:** Always use `--no-pager` (prevents terminal hangs)
2. **Worker Logs:** Stage markers `[..]` → `[OK]`
3. **File Naming:** `ComponentName.module.css` + `ComponentName.tsx`
4. **Commits:** Frequent, descriptive messages

---

## 🚫 Don't Touch (Deferred)

- ❌ Trace ID propagation
- ❌ Search component consolidation  
- ❌ Performance profiling
- ❌ Model version tracking

**Focus:** Fix user_cards, run E2E test, add safety constraints.

---

## 📞 Need Help?

**Architecture questions:** Read `SYSTEM_MAP.md` section 11  
**Database questions:** Read `docs/database-schema.md`  
**Session context:** Read `docs/working-memory/active_context.md` (single source of truth)

---

**Ready to code?** Read `docs/working-memory/active_context.md` and dive in! 🚀

