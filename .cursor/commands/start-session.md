# /start-session

- Read `docs/working-memory/active_context.md` FIRST.
- Follow its "Quick Links" → open the latest handoff it links.
- Summarize: current status, top priorities, and "What's Next" from the latest handoff.
- Locate any referenced files (layouts, components, CSS) and be ready to jump.
- DO NOT make commits yet. We batch commits at session end per Git rule 3.
- If there is a "Top Priority" fix, propose a 2-item todo list and start with item 1.
- Use semantic search to find impacted components before editing.
- Keep updates concise (1–2 sentences) between tool actions.
- Prefer CircuitDS patterns and reference `app/(circuitds)/circuitds/README.md` for any DS work.
- Assume Supabase env is correct; do not ask for .env. Use production/test DB.
- Windows note: If running any scripts, wrap them in PowerShell `.ps1` under `scripts/` with proper headers.

Expected behavior when invoked:
1) Open and summarize `active_context.md` and latest handoff.
2) List top 1–3 priorities.
3) Create or update a minimal todo list for this session.
4) Begin work on the highest priority without waiting for extra confirmation.
