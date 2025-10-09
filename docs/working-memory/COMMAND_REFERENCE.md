# Command Reference - Living Memory System

**Quick guide for session management commands.**

---

## 🎮 Session Commands

### `/end session`
**When:** End of coding session  
**Result:** Creates handoff docs, updates active context, commits everything

```bash
/end session
```

**What happens:**
1. ✅ Creates `context_handoff_YYYYMMDD_HHMM.md`
2. ✅ Creates `session_summary_YYYYMMDD.md`
3. ✅ Updates `active_context.md`
4. ✅ Updates `NEXT_SESSION_BRIEF.md`
5. ✅ Commits with descriptive message
6. ✅ Shows confirmation

---

### `/start session`
**When:** Beginning of coding session  
**Result:** Loads context and shows priorities

```bash
/start session
```

**What happens:**
1. 📖 Reads `active_context.md`
2. 📖 Reads `NEXT_SESSION_BRIEF.md`
3. 💬 Summarizes where you left off
4. 🎯 Highlights top priorities
5. ❓ Asks what to work on first

---

### `/checkpoint [label]`
**When:** Before risky changes or long breaks  
**Result:** Creates snapshot without ending session

```bash
/checkpoint before-refactor
/checkpoint working-state
/checkpoint bug-fix-attempt
```

**What happens:**
1. 📸 Creates `context_checkpoint_YYYYMMDD_HHMM_[label].md`
2. 💾 Captures current progress
3. ✅ Commits with checkpoint message
4. ▶️ Session continues

**Use cases:**
- Before major refactor
- Before trying experimental fix
- After solving complex problem (while fresh)
- Before switching to different task

---

## 📋 Example Workflows

### Typical Session Start
```
You: /start session

AI: Last session we validated the worker and cleaned up Review UI. 
    Found bug: user_cards_created = 0 in all runs.
    
    Top priority: Fix user_cards creation bug
    - Investigate resolve_card_uuid() in worker/worker.py
    - Check if card_keys table is populated
    
    Ready to continue? What's first?

You: Let's investigate the card_keys table
```

### Typical Session End
```
You: /end session

AI: ✅ Session ended successfully!

Created:
- context_handoff_20251009_1615.md
- session_summary_20251009_afternoon.md  
- Updated active_context.md
- Updated NEXT_SESSION_BRIEF.md

Commit: docs: end session 20251009_1615 - fixed user_cards bug

Next session: Type /start session
```

### Using Checkpoints
```
You: /checkpoint before-major-refactor

AI: 📸 Checkpoint created: context_checkpoint_20251009_1430_before-major-refactor.md

Captured:
- Current state: Investigating user_cards bug
- Finding: card_keys table is empty
- Next: Need to backfill card_keys from card_embeddings
- Open questions: Should worker auto-create mappings?

Committed. Session continues - proceed with refactor!

You: Great, now let's refactor resolve_card_uuid...
```

---

## 🔧 Advanced Usage

### Multiple Sessions in One Day
Each gets unique timestamp:
```
/end session  →  context_handoff_20251009_0930.md (morning)
/end session  →  context_handoff_20251009_1500.md (afternoon)
/end session  →  context_handoff_20251009_2130.md (evening)
```

### Session with Checkpoints
```
9:00 AM  - /start session
10:30 AM - /checkpoint before-database-migration
12:00 PM - /checkpoint working-migration
1:30 PM  - /checkpoint tests-passing
3:00 PM  - /end session
```

Result: 4 snapshots tracking progress through complex task

---

## 💡 Pro Tips

### When to Use Each Command

**Use `/start session` when:**
- ✅ Starting fresh after break
- ✅ New chat window
- ✅ Need context reminder
- ✅ Want priorities highlighted

**Use `/checkpoint` when:**
- ✅ About to try risky change
- ✅ Solved complex problem (document while fresh)
- ✅ Taking lunch break (mid-session)
- ✅ Want to preserve "last known good state"

**Use `/end session` when:**
- ✅ Done coding for the day
- ✅ Switching to different project
- ✅ Reached natural stopping point
- ✅ Want handoff ready for next time

### Best Practices

1. **End every session** - Even quick 30-min sessions
2. **Checkpoint before experiments** - Easy rollback if needed
3. **Label checkpoints clearly** - Future you will thank you
4. **Read active_context.md** - Even if you skip `/start session`

---

## 🚫 Don't Do This

❌ **Skip `/end session`** - You'll lose context  
❌ **Forget timestamp labels** - Hard to find later  
❌ **Create handoff manually** - Use the command, it's consistent  
❌ **Checkpoint too often** - Every 10 minutes is overkill

---

## 📞 Quick Reference Card

```
┌─────────────────────────────────────────────┐
│  Living Memory Commands                     │
├─────────────────────────────────────────────┤
│                                             │
│  /start session      Load context & start  │
│  /end session        Wrap up & save        │
│  /checkpoint [label] Snapshot progress     │
│                                             │
│  Always use at end of session!             │
└─────────────────────────────────────────────┘
```

---

## 📚 Related Documentation

- **`README.md`** - Full system documentation
- **`active_context.md`** - Where you left off
- **`NEXT_SESSION_BRIEF.md`** - What's next

---

**Remember:** The commands are patterns for the AI to recognize. Type them naturally in chat, and the AI will follow the documented workflow.

