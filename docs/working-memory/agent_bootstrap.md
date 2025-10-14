# Agent Bootstrap Order (/start session)

Single source of truth: `docs/working-memory/active_context.md`

Follow this exact sequence to avoid stale or duplicate instructions:

1) Load active context
- Read `docs/working-memory/active_context.md`
- Extract: latest handoff link, current priorities, conditional branches

2) Load latest handoff
- Open the handoff referenced as “Latest Handoff”
- Use its “What’s Next” section to set the immediate focus

3) Clear stale TODOs
- Discard any local cached TODOs from prior sessions
- Recreate TODO list from the handoff’s “What’s Next” only

4) Conditional branching
- If the handoff specifies conditions (e.g., “if Render succeeds vs fails”), check the condition first
- Choose the branch; ignore the other path for this session

5) Quick links / context (optional)
- Open docs listed under Quick Links for context only if needed (don’t treat them as instructions)

6) Gate before edits
- Read relevant files
- Make scoped edits
- Commit with an atomic message at a stable point (avoid interrupting deploys)

7) End of session
- Create a new handoff in `handoffs/YYYY/MM-<month>/context_handoff_YYYYMMDD_HHMM.md`
- Link it from `active_context.md` as “Latest Handoff”
- Keep state machine variables (conditions) obvious and minimal

Notes
- Do not consult older handoffs unless explicitly referenced by the latest handoff
- Never re-import old TODOs
- Prefer smallest number of living priorities; archive outdated briefs



