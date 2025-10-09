# Working Memory System

**Purpose:** Preserve session context and enable seamless continuity between coding sessions.

---

## 📁 Folder Structure

```
docs/working-memory/
├── README.md                           # This file (how to use the system)
├── context_handoff_YYYYMMDD_HHMM.md  # Session handoffs (timestamped)
├── session_summary_YYYYMMDD.md       # Session wrap-ups
└── active_context.md                  # Symlink/copy of latest handoff
```

---

## 🎯 How It Works

### 1. During a Session
Work normally. The AI will create planning docs as needed:
- `SYSTEM_MAP.md` (architecture overview)
- `TRIAGE_PLAN.md` (session goals)
- Session-specific investigations

### 2. At Session End
The AI creates two files:

**Context Handoff** (`context_handoff_YYYYMMDD_HHMM.md`):
- What was accomplished
- Where we left off
- Investigation paths for next session
- Critical code locations
- Database schema snippets
- Git patterns learned

**Session Summary** (`session_summary_YYYYMMDD.md`):
- High-level overview
- Commits made
- Metrics (files changed, lines added)
- Key learnings
- Next priorities

### 3. Starting Next Session
Copy the "Quick Start" section from latest context handoff and paste into new chat:

```
Hi! Continuing from session on [date].

Context: [Brief summary of where we left off]

Goals today:
1. [Top priority]
2. [Second priority]
3. [Third priority]

Please read docs/working-memory/context_handoff_YYYYMMDD_HHMM.md first.
```

---

## 📋 Templates

### Context Handoff Template
```markdown
# Context Handoff - [Date] [Time]

**Branch:** [branch-name]
**Last Session:** [Brief description]
**Duration:** [X hours]

## 🎯 Where We Left Off
[2-3 sentence summary]

## 🔴 Top Priority
**Problem:** [What needs fixing]
**Investigation Path:**
- File: [filename] lines [X-Y]
- Questions: [Key questions to answer]

## 📚 Must-Read Files
1. [Most important file]
2. [Second file]
3. [Third file]

## 🗃️ Database Schema (If Relevant)
[Key tables and relationships]

## 🎯 Session Goals (Copy to New Chat)
[Quick start message for next session]
```

### Session Summary Template
```markdown
# Session Summary - [Date]

**Branch:** [branch-name]
**Duration:** [X hours]
**Status:** ✅ Complete / 🚧 In Progress

## 🎯 Mission Accomplished
- ✅ [What was done]

## 📊 By The Numbers
- Commits: [X]
- Files Changed: [X]

## 🔍 Key Discoveries
[Important findings]

## 🚀 Ready for Next Session
[What's queued up]
```

---

## 🔄 Workflow Guide

### For the Human
1. **End of session:** Ask AI to create context handoff
2. **Start of session:** Reference latest handoff in new chat
3. **Weekly cleanup:** Archive old handoffs if folder gets cluttered

### For the AI
1. **Detect session end:** When user says "wrap up" or similar
2. **Create timestamped handoff:** `context_handoff_YYYYMMDD_HHMM.md`
3. **Create session summary:** `session_summary_YYYYMMDD.md`
4. **Update active_context.md:** Copy of latest handoff for quick reference
5. **Commit all docs:** Clean git commit with descriptive message

---

## 📖 File Naming Convention

### Context Handoffs (Detailed, for AI consumption)
```
context_handoff_20251009_1430.md
context_handoff_20251010_0900.md
context_handoff_20251010_1500.md
```
- Format: `context_handoff_YYYYMMDD_HHMM.md`
- When: End of every session
- Purpose: Give next AI complete context

### Session Summaries (High-level, for human review)
```
session_summary_20251009.md
session_summary_20251010_morning.md
session_summary_20251010_afternoon.md
```
- Format: `session_summary_YYYYMMDD[_label].md`
- When: End of every session
- Purpose: Human-readable progress log

### Active Context (Always latest)
```
active_context.md
```
- Symlink or copy of most recent context handoff
- Makes it easy to find "where am I now?"

---

## 🎨 Best Practices

### ✅ Do This
- **Timestamp everything** for traceability
- **Be specific** about file locations (with line numbers)
- **Include code snippets** for critical logic
- **Document git patterns** learned (like `--no-pager`)
- **List test data locations** explicitly
- **Provide debugging commands** ready to copy-paste

### ❌ Don't Do This
- Don't create generic handoffs ("we worked on stuff")
- Don't skip the quick start message
- Don't forget to commit handoffs to git
- Don't let handoffs exceed 500 lines (split into multiple docs)

---

## 🔍 Finding Information

### "Where did we leave off?"
```bash
# View latest handoff
cat docs/working-memory/active_context.md

# Or list all recent handoffs
ls -lt docs/working-memory/context_handoff_*.md | head -5
```

### "What did we accomplish last week?"
```bash
# View all session summaries
ls docs/working-memory/session_summary_*.md

# Read specific day
cat docs/working-memory/session_summary_20251009.md
```

### "What was the context at a specific time?"
```bash
# Find handoff from October 9, 2pm
cat docs/working-memory/context_handoff_20251009_1400.md
```

---

## 📊 Maintenance

### Weekly Cleanup
1. Review handoffs from past week
2. Archive handoffs older than 30 days:
   ```bash
   mkdir -p docs/working-memory/archive/2025-10
   mv docs/working-memory/context_handoff_202510*.md docs/working-memory/archive/2025-10/
   ```
3. Keep `active_context.md` and recent handoffs in main folder

### Monthly Review
1. Read all session summaries
2. Extract patterns and learnings
3. Update main `SYSTEM_MAP.md` if architecture changed
4. Create monthly progress report (optional)

---

## 🚀 Quick Reference

**Starting a session:**
```
@docs/working-memory/active_context.md 
Help me continue from last session
```

**Ending a session:**
```
Create context handoff and session summary for today's work.
Timestamp: [current time]
Main accomplishments: [list]
Next priorities: [list]
```

**Mid-session snapshot:**
```
Create a quick checkpoint of current progress.
Where are we with [specific task]?
What's working/not working?
```

---

## 💡 Why This Works

1. **Searchable history:** Timestamped files = easy to find context
2. **AI-friendly:** Structured format = consistent handoffs
3. **Human-friendly:** Session summaries = quick progress review
4. **Git-tracked:** All context committed = never lose progress
5. **Scalable:** Folder structure supports growth

---

## 🎓 Learning from Sessions

Over time, this folder becomes a **knowledge base**:
- Common patterns emerge (e.g., "always use --no-pager")
- Bug investigation paths get refined
- Best practices crystallize
- Onboarding new devs becomes trivial (just read recent handoffs)

---

**Use this system to build institutional memory, one session at a time.** 🧠✨

