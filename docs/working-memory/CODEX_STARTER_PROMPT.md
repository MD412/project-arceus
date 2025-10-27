# 🚀 Codex Starter Prompt

Copy-paste this into new Cursor/Claude sessions:

---

## Context Load Instructions

You're working on **Project Arceus** (Pokémon TCG collection manager with AI vision).

### Step 1: Learn the Session System
```
READ: docs/working-memory/SESSION_BOOTSTRAP.md
```
This teaches you how to navigate the working memory system (start/end session protocols).

### Step 2: Load Current Context
```
READ: docs/working-memory/active_context.md
```
Current status, priorities, latest handoff link.

### Step 3: Load Latest Session Details
```
Follow the "Latest Handoff" link from active_context.md
```
Usually: `docs/working-memory/handoffs/2025/10-october/context_handoff_YYYYMMDD_HHMM.md`

### Step 4: Check for Implementation Specs
If active context references specific phases/features:
```
CHECK: docs/working-memory/phase5a_implementation_prompt.md
or similar spec files for detailed technical requirements
```

### Step 5: Execute
Look at "Next Session Entry Points" or "Top Priorities" and **start working**.

Don't ask what to do — the handoff tells you exactly where to begin.

---

## Quick File Map

```
docs/working-memory/
├── SESSION_BOOTSTRAP.md          ← How the system works
├── active_context.md             ← Current status (START HERE)
├── handoffs/
│   └── 2025/10-october/
│       └── context_handoff_*.md  ← Latest session details
├── summaries/                     ← Archived deep-dives
└── phase5a_implementation_prompt.md  ← Feature specs
```

---

## One-Line Starter

For maximum speed, just use:
```
Read docs/working-memory/SESSION_BOOTSTRAP.md, then follow /start-session protocol
```

That's it. The bootstrap guide handles the rest.

