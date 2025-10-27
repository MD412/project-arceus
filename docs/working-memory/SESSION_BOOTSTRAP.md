# Session Bootstrap - Universal Context Loader

Copy this into new Cursor/Claude sessions to load project context.

---

## `/start-session` Protocol

When starting a new session, follow this sequence:

### Step 1: Read Active Context
```
File: docs/working-memory/active_context.md
```
This is the **single source of truth**. It contains:
- Current branch & status
- Top priorities ranked
- Link to latest handoff
- Technical state summary

### Step 2: Read Latest Handoff
Follow the link from `active_context.md` → "Latest Handoff"

Handoff files contain:
- What was accomplished last session
- Files modified/created
- Current working state (what's working, what's not)
- Detailed roadmap for next phases
- **"Next Session Entry Points"** ← Your TODO list

### Step 3: Understand Project Structure
- **Active Context** = High-level status + priorities
- **Handoffs** = Session summaries with technical details
- **Summaries** = Archived deep-dives (read if referenced)
- **Specs** = Implementation prompts for specific features

### Step 4: Execute Next Steps
Look for "Next Session Entry Points" or "Top Priorities" in handoff/active_context.
Don't ask what to do — **just start executing** based on those instructions.

---

## `/end-session` Protocol

### Step 1: Create Handoff Document
```
File: docs/working-memory/handoffs/YYYY/MM-month/context_handoff_YYYYMMDD_HHMM.md
```

**Template:**
```markdown
# Context Handoff - [Date] @ [Time]

Branch: `[branch-name]`
Status: [one-line status]

---

## Session Accomplishments
- What was completed
- Problems solved
- Key decisions made

---

## Files Modified/Created
List all changed files with brief description

---

## Current State

### What's Working
- List functional features

### What's Not
- List broken/incomplete items

### Known Issues
- List bugs/blockers

---

## What's Next

### Immediate Priorities
1. First thing to do
2. Second thing
3. Third thing

### Entry Points for Next Session
Specific files/functions to start with + exact tasks

---

## Key Insights
Technical learnings, gotchas, important patterns discovered

Status: [Ready for X / Blocked on Y / Testing Z]
```

### Step 2: Update Active Context
Update `docs/working-memory/active_context.md`:
- Change "Last Updated" timestamp
- Update "Latest Handoff" link
- Revise "Top Priorities" if changed
- Update "Current Status" one-liner
- Modify "Technical State" if architecture changed

### Step 3: Commit Everything
```bash
git add -A
git commit -m "session: [brief description of session work]"
git push
```

---

## Project Overview (For First-Time Sessions)

**Project Arceus** = Pokémon TCG collection manager with AI vision

### Architecture
- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Backend:** Supabase (Postgres + Storage + Auth)
- **Worker:** Python job queue (Render) for card identification
- **AI Vision:** YOLO card detection → Retrieval v2 (ViT embeddings + template matching)

### Key Systems
1. **Scan Pipeline:** User uploads binder photo → YOLO crops cards → Worker identifies → Results in DB
2. **Retrieval v2:** Hybrid matching (template similarity + CLIP embeddings) with UNKNOWN threshold
3. **Gallery:** 15,504 cards, 46,512+ templates from official art + clean user scans
4. **Command Queue:** Optimistic UI updates via CQRS pattern (delete/rename/retry operations)

### Current Phase
Check `active_context.md` "Current Status" section.

Recent work: Retrieval v2 deployed, domain gap solved with clean scan templates, Phase 5 learning system designed.

### Codebase Layout
```
app/                    # Next.js app (frontend + API routes)
  (main)/              # User-facing pages
  (circuitds)/         # Design system library
  (handbook)/          # Architecture docs
worker/                # Python job processor
  worker.py           # Main job loop
  retrieval_v2.py     # Card identification
supabase/
  migrations/         # Database schema
scripts/              # Utility scripts
docs/
  working-memory/     # Session context (you are here)
```

---

## Quick Commands

### Check Context
```bash
# Read active status
cat docs/working-memory/active_context.md

# Find latest handoff
ls -lt docs/working-memory/handoffs/2025/*/
```

### Development
```bash
# Run frontend
npm run dev

# Apply DB migration
supabase db push

# Run worker locally (rarely used - prod DB only)
cd worker && python worker.py

# Trigger worker deploy (Render auto-deploys on push)
git push
```

### Database Queries
```bash
# Check recent scans
supabase db execute "SELECT id, status, created_at FROM scans ORDER BY created_at DESC LIMIT 10"

# Check card templates
supabase db execute "SELECT card_id, COUNT(*) FROM card_templates GROUP BY card_id ORDER BY COUNT(*) DESC LIMIT 10"

# Check retrieval v2 RPC
supabase db execute "SELECT * FROM identify_card_v2('[crop-embedding-vector]', 5)"
```

---

## When Things Are Unclear

**Never guess.** Always:
1. Check `active_context.md` for current priorities
2. Read latest handoff for technical details
3. Grep codebase for existing patterns
4. Read referenced doc files (handbook, specs)
5. Ask user only if truly blocked

**The docs exist to eliminate ambiguity.** Use them.

---

## Session Lifecycle Example

```
User: /start-session

AI:
1. Reads active_context.md → sees "Phase 5a implementation" priority
2. Reads latest handoff → finds entry points (create migration, update worker, add UI)
3. Starts executing: creates migration file
4. Updates worker logging
5. Adds correction UI
6. Tests loop
7. Creates handoff doc
8. Updates active_context.md
9. Commits: "session: implement Phase 5a training feedback table"

Done. No questions needed.
```

---

**Bottom line:** This documentation system is your **external brain**. Read it, trust it, update it. The more faithfully you maintain it, the smoother context switches become.

Start every session with `active_context.md`. End every session with a handoff. Never leave the next AI guessing what to do.

