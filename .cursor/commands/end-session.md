# /end-session

- Gather session changes: summarize modified files and key work completed.
- Create handoff docs under `docs/working-memory/handoffs/YYYY/MM-<month>/context_handoff_YYYYMMDD_HHMM.md` with:
  - Where we are, what got done, known issues, what's next, related files modified
- Create `docs/working-memory/session_summary_YYYYMMDD.md` with bullet highlights.
- Update `docs/working-memory/active_context.md`:
  - Set Status to reflect modified/clean
  - Update Quick Links “Last handoff” link
  - Update Top Priority and Next steps
- Optionally update `NEXT_SESSION_BRIEF.md` if present with concise next-session plan.
- Batch commit per Git Rule 3 (single descriptive message covering all related edits).
- Do not trigger long-running tasks; keep outputs concise.
- Assume env keys are correct; no local Supabase linkage needed.

Expected behavior when invoked:
1) Write handoff + session summary
2) Update `active_context.md` (and brief if present)
3) Stage and commit all related changes with a descriptive message
4) Print a compact summary of created/updated files and next-session starter
