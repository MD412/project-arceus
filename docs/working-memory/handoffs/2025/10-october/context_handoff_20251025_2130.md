# Context Handoff - October 25, 2025 @ 9:30 PM

Branch: `main`
Status: Phase 2 in progress (gallery growing on GPU); Phase 3 enabled (v2 retrieval live)

---

## Session Accomplishments

### Backbone & Tests
- ViT-L/14-336 embedder added (strict transforms, TTA(2)); deterministic; smoke-tested.
- PowerShell/Python smoke tests created; verified on CPU and GPU.

### Phase 2 — Schemas & Population
- Tables added: `card_templates` (vector(768), cosine, ANN index), `card_prototypes` (vector(768)).
- Scripts added: `scripts/embed_gallery.py` (+ `Build-GalleryTemplates.ps1`) and `scripts/build_prototypes.py` (+ `Build-CardPrototypes.ps1`).
- Fixed prototype builder to parse vectors when returned as strings.
- Gallery population running on local RTX 3080; upserts in batches of 48 templates (≈3 per card). Safe to stop/resume; idempotent.

### Phase 3 — Retrieval v2
- RPC helpers added: `match_card_templates`, `get_card_prototypes` (cosine).
- New `worker/retrieval_v2.py`: TTA embed → ANN templates → group by `card_id` → prototype fusion (0.7/0.3) → threshold gate.
- Flags added; worker wired to honor `RETRIEVAL_IMPL=v2`.
- Dry-run script added (`Test-RetrievalV2.ps1`); verified top‑5 locally.
- Enabled v2 in Render (env vars updated) and deployed.

---

## Files Modified / Added (high-level)
- worker/openclip_embedder.py, worker/__init__.py
- worker/retrieval_v2.py
- scripts/Test-EmbedderSmoke.ps1, scripts/test_embedder_smoke.py
- scripts/Test-RetrievalV2.ps1, scripts/test_retrieval_v2.py
- scripts/embed_gallery.py, scripts/Build-GalleryTemplates.ps1
- scripts/build_prototypes.py, scripts/Build-CardPrototypes.ps1
- supabase/migrations/*create_card_gallery_tables.sql, *retrieval_v2_functions.sql
- docs/working-memory/active_context.md (updated links/status)

---

## Known Issues / Notes
- Large first-run model/image download times expected.
- Gallery population is long-running; safe to Ctrl+C and resume later.
- Local Python environment fixed to resolve NumPy ABI mismatch (NumPy 1.26.4 path validated and smoke-tested with GPU).

---

## What's Next
1) Finish Phase 2 population
   - Let gallery build complete (or stop at target size: ~900–1200 templates) and run prototypes:
     - `pwsh -File scripts/Build-CardPrototypes.ps1`
   - Verify counts in Supabase (templates and prototypes).

2) Phase 4 — Threshold Calibration
   - Add/run eval harness over real crops; sweep `UNKNOWN_THRESHOLD` to hit ≥99% precision.
   - Set production `UNKNOWN_THRESHOLD` accordingly and redeploy.

3) Phase 5 — Logging & Hard-Negative Mining
   - Add `ident_logs`, log top‑5 candidates + final labels, mine confusions, and upsert user‑correction templates.

---

## Entry Points
- Embedder: `worker/openclip_embedder.py`
- Retrieval v2: `worker/retrieval_v2.py`
- Population: `scripts/Build-GalleryTemplates.ps1`, `scripts/Build-CardPrototypes.ps1`
- Dry-run: `scripts/Test-RetrievalV2.ps1`

Status: Ready to finish Phase 2 population, then begin Phase 4 calibration.
