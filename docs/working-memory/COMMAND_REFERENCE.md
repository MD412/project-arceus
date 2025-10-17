# Command Reference

**Last Updated:** October 17, 2025  
**Status:** ✅ Active

---

## Session Management

### `/start-session`

Start a new coding session with full context loading.

**What it does:**
1. Reads `active_context.md` for current status
2. Opens latest handoff for detailed context
3. Summarizes: current status, top priorities, "What's Next"
4. Creates minimal todo list if priorities exist
5. Begins work on highest priority without waiting

**When to use:** Start of every coding session

**Example:**
```
/start-session
```

---

### `/end-session`

End the current session and create handoff documentation.

**What it does:**
1. Creates handoff document in `handoffs/YYYY/MM-month/`
2. Creates session summary in `summaries/YYYY/MM-month/`
3. Updates `active_context.md` with current status
4. Commits all changes with session-scoped commit message
5. Documents "What's Next" for future sessions

**When to use:** End of every coding session

**Example:**
```
/end-session
```

**Note:** Per Git Rule 3, we batch commits at session end rather than after every tiny change.

---

## Debugging

### `/debug-css`

Invoke systematic CSS debugging protocol for difficult layout issues.

**What it does:**
1. **STOPS guessing** - switches to systematic analysis mode
2. **Maps entire hierarchy** - reads all ancestor components and CSS files
3. **Traces constraint chains** - checks every parent's layout properties
4. **Documents analysis** - shows the tree structure and identifies breaks
5. **Explains the fix** - describes WHY the solution works

**When to use:**
- You say "this CSS is difficult" / "think very hard"
- Same element misbehaves after 2-3 attempts
- Screenshots show persistent layout breaks
- Issues involve nested flex/grid/modals

**Example:**
```
/debug-css

The scan image overflows its modal container despite max-height: 100%
```

**Reference:** See `css-debugging-protocol.md` for full methodology

**Key principle:** CSS issues that persist aren't magic - there's ONE broken link in the constraint chain.

---

## Development

### `/checkpoint`

Create a checkpoint document for significant progress or discoveries.

**What it does:**
1. Creates a timestamped report in `reports/YYYY/MM-month/`
2. Documents current investigation or solution
3. Can be referenced in future handoffs

**When to use:**
- After solving a difficult bug
- Completing a significant feature
- Discovering important patterns
- Mid-session documentation

**Example:**
```
/checkpoint bug-investigation-modal-overflow
```

---

## Context & Planning

### `/handoff`

Create a handoff document without ending the session.

**What it does:**
- Generates handoff document for current state
- Useful for mid-session context capture
- Doesn't update active_context or commit

**When to use:**
- Long sessions where you want to capture progress
- Before switching to a completely different task
- Creating a savepoint

**Example:**
```
/handoff modal-css-refinement
```

---

### `/status`

Quick status check without full context loading.

**What it does:**
- Shows current branch
- Lists uncommitted changes
- Shows top 3 priorities from active_context
- Quick git status

**When to use:**
- Quick check of what's in progress
- Before deciding what to work on

**Example:**
```
/status
```

---

## Architecture

### `/trace-hierarchy`

Map the component and CSS hierarchy for a specific element.

**What it does:**
1. Reads React component structure
2. Reads all applicable CSS files
3. Documents the tree with relevant properties
4. Identifies cascade conflicts

**When to use:**
- Before making complex CSS changes
- Debugging component interactions
- Understanding inherited behavior

**Example:**
```
/trace-hierarchy CardDetailModal
```

---

## Git Workflow

### Commit Strategy (Rule 3)

**Automatic behavior** - you don't need to invoke this:

- ❌ Don't commit after every tiny change
- ✅ Let changes accumulate during session
- ✅ Commit everything when `/end-session` is called
- ✅ Creates clean, session-scoped commits

**Override only when:**
- User explicitly asks to commit
- Before switching to completely unrelated work
- Completing a major feature mid-session

---

## Design System

### CircuitDS Integration

When working on design system components, agent automatically references:
- `app/(circuitds)/circuitds/README.md` - Component conventions
- Global design tokens in `app/globals.css`
- Existing patterns in `app/styles/circuit.css`

**Triggers:**
- "design system changes"
- "circuitds update"
- "modify circuitds"
- "add to circuitds"
- "new ds component"

---

## Supabase Context

**Automatic behavior** - you don't need to invoke this:

- Agent assumes `.env` is correct and working
- Uses production/test DB (no local `supabase link`)
- Won't ask for environment keys
- Env files are .gitignored but present

**Note:** This is a solo stealth project - production IS the test env.

---

## Quick Reference

| Command | Use Case | Creates Docs? |
|---------|----------|---------------|
| `/start-session` | Begin work | No |
| `/end-session` | Finish work | Yes (handoff + summary) |
| `/debug-css` | Hard CSS problems | No (uses protocol) |
| `/checkpoint` | Mid-session save | Yes (report) |
| `/handoff` | Context capture | Yes (handoff) |
| `/status` | Quick check | No |
| `/trace-hierarchy` | Map components | No (inline) |

---

## Adding New Commands

To add a new command:

1. Document it here with clear "What it does" / "When to use"
2. Update agent bootstrap or workspace rules if needed
3. Test with a few examples
4. Update this file's "Last Updated" timestamp

---

**These commands create a consistent workflow across sessions, making AI handoffs seamless.** 🚀

