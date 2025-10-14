# Working Memory Organization System

**Last Updated:** October 10, 2025  
**Status:** ✅ Active

---

## 🎯 Philosophy

This organization system is designed to **scale to thousands of files** while remaining easy to navigate.

### Key Principles

1. **Organize by type first** - Group similar documents together
2. **Then by date** - Year → Month for chronological access
3. **Keep current files accessible** - Root level has "always current" references
4. **Archive superseded docs** - Use `archived/` subfolders within months

---

## 📁 Folder Structure

```
docs/working-memory/
│
├── 🟢 ALWAYS CURRENT (Root Level)
│   ├── README.md                    # System documentation
│   ├── ORGANIZATION.md              # This file
│   ├── COMMAND_REFERENCE.md         # /start, /end, /checkpoint commands
│   ├── active_context.md            # Current state (updated each session)
│   └── NEXT_SESSION_BRIEF.md        # Forward-looking priorities
│
├── 📝 HANDOFFS (Context for AI)
│   └── handoffs/
│       └── YYYY/
│           └── MM-month/
│               ├── context_handoff_YYYYMMDD_HHMM.md
│               ├── context_handoff_YYYYMMDD_UNIFIED.md (preferred)
│               └── archived/        # Superseded by UNIFIED versions
│
├── 📊 SUMMARIES (For humans)
│   └── summaries/
│       └── YYYY/
│           └── MM-month/
│               ├── session_summary_YYYYMMDD.md
│               └── session_summary_YYYYMMDD_label.md
│
├── 🔬 REPORTS (Investigations, tests, triage)
│   └── reports/
│       └── YYYY/
│           └── MM-month/
│               ├── bug_investigation_*.md
│               ├── *_testing_report_*.md
│               ├── triage_plan_*.md
│               └── [any other analysis docs]
│
└── 📦 ARCHIVE (Misc, one-off notes)
    └── archive/
        └── [miscellaneous archive files]
```

---

## 🗂️ File Types Explained

### Root Level Files (Always Current)

These files are **always at the root** and get updated regularly:

| File | Purpose | When to Update |
|------|---------|----------------|
| `active_context.md` | Current state snapshot | Every session end |
| `NEXT_SESSION_BRIEF.md` | Forward priorities | When goals change |
| `README.md` | System documentation | When process changes |
| `COMMAND_REFERENCE.md` | Command automation | When commands added |
| `ORGANIZATION.md` | This file | When structure changes |

### Handoffs (Context for AI)

**Purpose:** Complete context for AI to pick up where you left off  
**Audience:** AI (and humans who want deep detail)  
**When:** End of each session

**Naming:**
- `context_handoff_20251010_0950.md` - Individual session
- `context_handoff_20251010_UNIFIED.md` - Combined multiple sessions from same day

**Contents:**
- Where we left off (specific files, line numbers)
- Investigation paths with concrete next steps
- Database schema (if relevant)
- Code snippets for critical logic
- Quick start message for next session

**Location:** `handoffs/YYYY/MM-month/`

### Summaries (For Humans)

**Purpose:** High-level progress tracking  
**Audience:** Humans (quick review)  
**When:** End of each session

**Naming:**
- `session_summary_20251010.md` - Single session
- `session_summary_20251010_morning.md` - Multiple sessions same day

**Contents:**
- Mission accomplished (what was done)
- Commits made
- Files changed metrics
- Key discoveries
- Next priorities

**Location:** `summaries/YYYY/MM-month/`

### Reports (Deep Dives)

**Purpose:** Detailed investigations, testing, planning  
**Audience:** Both AI and humans  
**When:** As needed during sessions

**Types:**
- `bug_investigation_*.md` - Root cause analysis
- `*_testing_report_*.md` - Test results, coverage
- `triage_plan_*.md` - Session planning
- Performance analysis, architecture reviews, etc.

**Location:** `reports/YYYY/MM-month/`

### Archive (Misc)

**Purpose:** One-off notes that don't fit elsewhere  
**Audience:** Reference only  
**When:** Rarely

**Examples:**
- `ARCHIVE_NOTE_20251009.md` - Meta notes about archiving
- Migration notes
- Historical explanations

**Location:** `archive/`

---

## 📅 Date Organization

### Month Naming Convention

Use **zero-padded number + full month name** for clarity:

```
✅ Good:
- 01-january
- 02-february
- 10-october
- 12-december

❌ Bad:
- 1-jan
- oct
- 10
```

**Why:** Sorts correctly, clear at a glance, no ambiguity

### Year Folders

Simple four-digit year:

```
2025/
2026/
```

**When to create:** When first document for that year/month is created

---

## 🔄 Workflow Automation

### When `/end session` is called:

1. **Create handoff** → `handoffs/YYYY/MM-month/context_handoff_YYYYMMDD_HHMM.md`
2. **Create summary** → `summaries/YYYY/MM-month/session_summary_YYYYMMDD.md`
3. **Update active context** → Root `active_context.md` gets refreshed
4. **Update next brief** → Root `NEXT_SESSION_BRIEF.md` if needed
5. **Commit all docs** → Git tracks everything

### When `/start session` is called:

1. **Read** → `active_context.md` (always current)
2. **Summarize** → Where we left off, top priorities
3. **Ready to work** → Ask what to tackle first

---

## 🧹 Maintenance

### Daily (Automatic)
- Update `active_context.md` at session end
- Create new handoffs/summaries in current month folder

### Weekly (Manual)
- Review handoffs from past week
- Move superseded handoffs to `archived/` subfolder
  ```bash
  # Example: Move old handoffs replaced by UNIFIED version
  mv handoffs/2025/10-october/context_handoff_20251009_*.md \
     handoffs/2025/10-october/archived/
  ```

### Monthly (Manual)
- Create next month's folders when needed:
  ```bash
  New-Item -ItemType Directory -Force -Path `
    "handoffs/2025/11-november", `
    "summaries/2025/11-november", `
    "reports/2025/11-november"
  ```
- Review previous month's summaries
- Extract patterns and learnings

### Yearly (Optional)
- Archive previous year to compressed folder
- Create annual progress report
- Update main project documentation with learnings

---

## 🔍 Finding Documents

### Use Case: "Where did we leave off?"

```bash
# Always start here
cat docs/working-memory/active_context.md
```

### Use Case: "What happened on October 9?"

```bash
# Check handoff first (detailed)
cat docs/working-memory/handoffs/2025/10-october/context_handoff_20251009_UNIFIED.md

# Or summary (high-level)
cat docs/working-memory/summaries/2025/10-october/session_summary_20251009.md
```

### Use Case: "What was that bug investigation about user_cards?"

```bash
# List reports for October
ls docs/working-memory/reports/2025/10-october/

# Read specific report
cat docs/working-memory/reports/2025/10-october/bug_investigation_user_cards_20251010.md
```

### Use Case: "Show me all testing reports"

```bash
# Search across all months
ls docs/working-memory/reports/2025/*/*.md | grep testing
```

### Use Case: "What did we accomplish last week?"

```bash
# List all summaries for October
ls docs/working-memory/summaries/2025/10-october/
```

---

## 📈 Scaling to Thousands of Files

This structure is designed to scale gracefully:

### At 10 files (Week 1)
```
handoffs/2025/10-october/          [3 files]
summaries/2025/10-october/         [3 files]
reports/2025/10-october/           [2 files]
```
✅ Easy to browse

### At 100 files (Month 3)
```
handoffs/2025/
  ├── 10-october/  [15 files]
  ├── 11-november/ [12 files]
  └── 12-december/ [18 files]
```
✅ Still navigable by month

### At 1,000 files (Year 2)
```
handoffs/
  ├── 2025/  [180 files across 12 months]
  └── 2026/  [150 files across 10 months]
```
✅ Year folders prevent overcrowding

### At 10,000 files (Year 5)
```
handoffs/
  ├── 2025/  [~500 files]
  ├── 2026/  [~800 files]
  ├── 2027/  [~900 files]
  ├── 2028/  [~1000 files]
  └── 2029/  [~800 files]
```
✅ Old years can be archived/compressed  
✅ Current year always fast to access

---

## 🎓 Best Practices

### ✅ Do This

1. **Use consistent naming**
   - `context_handoff_YYYYMMDD_HHMM.md`
   - `session_summary_YYYYMMDD.md`
   - `bug_investigation_[topic]_YYYYMMDD.md`

2. **Prefer UNIFIED handoffs**
   - For multi-session days, create one UNIFIED doc
   - Move individual handoffs to `archived/` subfolder

3. **Keep root level clean**
   - Only "always current" files stay at root
   - Everything else goes in type folders

4. **Use descriptive report names**
   - ❌ `report_20251010.md`
   - ✅ `bug_investigation_user_cards_20251010.md`

### ❌ Avoid This

1. **Don't flatten the structure**
   - Putting all files at root defeats the purpose

2. **Don't use inconsistent naming**
   - Stick to the conventions for searchability

3. **Don't forget to archive superseded docs**
   - Use `archived/` subfolders within months

4. **Don't create folders prematurely**
   - Create month folders as needed, not in advance

---

## 💡 Benefits of This System

### For AI Context Loading
- ✅ `active_context.md` always at known location
- ✅ Quick links to latest handoffs/reports
- ✅ No searching through flat file list

### For Human Review
- ✅ Browse by month to see progress over time
- ✅ Summaries separated from detailed handoffs
- ✅ Reports easy to find by type and date

### For Long-Term Scaling
- ✅ Thousands of files remain organized
- ✅ Old years can be archived without breaking structure
- ✅ Consistent patterns make automation easy

### For Knowledge Building
- ✅ Historical handoffs preserve decision context
- ✅ Bug investigations become reference library
- ✅ Testing reports show quality trends

---

## 🚀 Quick Commands

### Create new month folders
```powershell
New-Item -ItemType Directory -Force -Path `
  "docs/working-memory/handoffs/2025/11-november", `
  "docs/working-memory/summaries/2025/11-november", `
  "docs/working-memory/reports/2025/11-november"
```

### Move superseded handoffs to archive
```powershell
Move-Item -Path `
  "docs/working-memory/handoffs/2025/10-october/context_handoff_20251009_*.md" `
  -Destination "docs/working-memory/handoffs/2025/10-october/archived/"
```

### List all documents from a specific month
```powershell
# All handoffs
Get-ChildItem -Path "docs/working-memory/handoffs/2025/10-october/" -Recurse

# All reports
Get-ChildItem -Path "docs/working-memory/reports/2025/10-october/"

# All summaries
Get-ChildItem -Path "docs/working-memory/summaries/2025/10-october/"
```

### Find documents by keyword
```powershell
# Search all handoffs for "user_cards"
Get-ChildItem -Path "docs/working-memory/handoffs/" -Recurse -Filter "*.md" | 
  Select-String "user_cards"

# Search reports for "bug"
Get-ChildItem -Path "docs/working-memory/reports/" -Recurse -Filter "*.md" | 
  Where-Object { $_.Name -match "bug" }
```

---

## 🎯 Success Metrics

You'll know the system is working when:

- ✅ You can find any document within 10 seconds
- ✅ Starting a new session takes < 1 minute (read active_context.md)
- ✅ You can browse a full month's work at a glance
- ✅ The folder structure doesn't feel overwhelming even with 100+ files
- ✅ New AI sessions load context correctly without manual file hunting

---

**This system turns chaotic session notes into a searchable, scalable knowledge base.** 🧠✨

















