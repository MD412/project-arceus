# Context Handoff - October 24, 2025 @ 5:30 PM

Branch: `main`
Status: Phase 1 complete — OpenCLIP ViT-L/14-336 embedder + smoke tests

---

## Session Accomplishments

### 1) Phase 1: Embedder Backbone + Preprocessing
- Added OpenCLIP ViT-L/14-336 embedder with strict transforms (resize shortest side→336, pad to square, bicubic+antialias, OpenCLIP mean/std).
- Implemented TTA(2): center + horizontal flip; average normalized vectors then L2 again.
- Determinism enabled (seeded, CuDNN deterministic, benchmarking disabled).
- Pinned dependencies for torch/torchvision/open-clip across root and worker.

### 2) Config Flags
- VISION_MODEL=vit_l_14_336, TTA_VIEWS=2, FUSION_WEIGHTS=0.7,0.3, UNKNOWN_THRESHOLD=0.0, USE_CUDA_IF_AVAILABLE=1.

### 3) Smoke Tests
- Added Python and PowerShell smoke tests; verified on CPU.
- Result: 768-d embeddings, L2≈1.0, deterministic. Initial timed runs ~2.4s/embedding with TTA(2) (includes first-run overhead/model caching).

---

## Files Modified
- requirements.txt (pins added)
- worker/requirements.txt (pins updated)
- worker/config.py (vision flags added)
- worker/openclip_embedder.py (NEW)
- __tests__/ocr/test_embedder_smoke.py (NEW)
- scripts/test_embedder_smoke.py (NEW)
- scripts/Test-EmbedderSmoke.ps1 (NEW)
- __tests__/ocr/test_clip_automation.py (minor logging/exec tweak)

---

## Known Issues / Notes
- None blocking. Model download (~1.7GB) on first run is expected; cached afterwards.
- Future phases will introduce DB schema and retrieval path; keep embedder module stable.

---

## What's Next
1. Phase 2 — Gallery Schemas + Population (Top Priority)
   - Create card_templates (vector(768), cosine; HNSW default; metadata: set_id, variant, source, aug_tag).
   - Create card_prototypes (vector(768), cosine; per-card mean of normalized templates, template_count).
   - Populate: embed 2–3 templates per card with ViT-L/14-336, write templates and prototypes.

2. Phase 3 — Retrieval + Thresholding
   - Query TTA(2) → ANN top-K on card_templates → group by card_id → fuse best-template and prototype (0.7/0.3) → unknown gate by τ.
   - Optional: set_id prefilter; k-reciprocal re-rank behind a flag.

3. Phase 4 — Eval + Threshold Calibration
   - Build held-out real-crop set (200–500). Plot precision vs unknown; pick τ for ≥99% precision. Measure latency on CPU.

---

## Related / Entry Points
- Embedder: worker/openclip_embedder.py
- Flags: worker/config.py
- Smoke tests: __tests__/ocr/test_embedder_smoke.py, scripts/Test-EmbedderSmoke.ps1
- Deps: requirements.txt, worker/requirements.txt

Status: Ready to begin Phase 2 (schemas + population).
