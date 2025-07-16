# Card Identification via Image Embeddings — Implementation Plan

_Last updated: 2025-07-15_

## 1. Goals

* Replace brittle OCR-only matching with a robust image-embedding search that uniquely identifies a Pokémon card by **set code + number**.
* Keep inference < **1 s per crop** on a CPU worker and < **150 ms** on GPU.
* Minimise external costs – cloud OCR / LLM only as final fallback (< 2 % of crops).
* Provide deterministic, testable results (green unit tests for `greavard`, `wugtrio`, `pidgeot_ex`).

## 2. High-Level Architecture

```mermaid
flowchart TD
    A[Crop Image] --> B[OpenCLIP Encoder]\n(ViT-B/32)
    B --> C{pgvector / FAISS}\n(KNN search)
    C -->|cos ≥ 0.90| D[Unique Card Match]
    C -->|Multiple| E[OCR tie-break]\n(title or set/number)
    E --> F[Best Candidate]
    F --> G[Return Card\n(set, number, name)]
    C -->|< 0.85| H[Cloud Escalation]\n(Google Vision \n or GPT-4o)
```

## 3. Components

| Layer | Tooling | Notes |
|-------|---------|-------|
| Embedding Model | **OpenCLIP ViT-B/32** | 400 MB, 512-D vector, good zero-shot recall |
| Vector Store | **pgvector** (Supabase) | persist embeddings in `card_embeddings` (vector(512)) |
| Local Index | **FAISS ivfflat** | optional for offline dev; syncs with pgvector |
| Catalogue Source | PokémonTCG.io bulk data dump | ~15 k English cards, includes set + number |
| Worker Integration | `worker/worker.py` | encode crop, query KNN, pick best |
| Unit Tests | PyTest (`__tests__/ocr/`) | pass/fail on sample crops |

## 4. Implementation Steps

### 4.1 One-off Catalogue Embedding Script (Day 0)
1. Fetch PokémonTCG bulk JSON (`https://api.pokemontcg.io/v2/bulk`).
2. For each card, download `images.small` (≈ 300×420) – ~300 MB total.
3. Encode with OpenCLIP → 512-D numpy array.
4. Insert into `card_embeddings` table:
   ```sql
   CREATE TABLE card_embeddings (
     card_id TEXT PRIMARY KEY,
     embedding vector(512)
   );
   CREATE INDEX ON card_embeddings USING ivfflat (embedding vector_cosine_ops);
   ```
5. Commit migration & store a parquet backup in `/data/card_embeddings.parquet`.

### 4.2 Worker-Side Lookup (Day 1)
1. Load OpenCLIP weights once at start (`device="cuda" if available`).
2. For each crop:
   * `img = preprocess(crop, 224)`
   * `embed = model.encode_image(img).cpu().numpy()`
   * `SELECT card_id, 1 - (embedding <=> $embed) AS sim
      FROM card_embeddings
      ORDER BY embedding <=> $embed
      LIMIT 5;`
3. Accept if `sim ≥ 0.90` **and** no conflicting second candidate within `sim – 0.02`.
4. If multiple, run quick title OCR + string similarity to break the tie.
5. If none `≥ 0.85` → escalate to cloud OCR/LLM.

### 4.3 Test Harness Upgrade (Day 1)
* Add expected `card_id` field to each `.json` fixture.
* New assertion: cosine sim ≥ 0.90 for returned card.
* Run in CI (`npm run test:worker`).

### 4.4 Performance & Resource Hardening (Day 2)
* Batch encode 9 crops → single forward pass.
* Warm pgvector connection pool; set `ivfflat.probes=10`.
* Memory check: keep model FP16 on GPU; omit gradients.

### 4.5 Progressive Roll-Out (Day 3)
1. Deploy to staging; process 100 historical scans, log match rate.
2. Compare against OCR-only baseline; target **≥ 85 % auto-match**.
3. Toggle feature flag `use_clip_matching` in `.env` before production.

## 5. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Embedding DB download large | slow CI | cache parquet in repo LFS, skip in CI |
| pgvector CPU latency > 100 ms | worker idle backlog | build FAISS local copy for hot queries |
| CLIP false-positive (similar artwork variants) | wrong card saved | require OCR tie-break if top-2 sims < 0.02 diff |
| GPU not available | high latency | fall back to CPU; batch crops; still < 1 s on modern VM |

## 6. Milestones / Deliverables

1. **M1 – Catalogue embeddings** stored & indexed (ETL script + migration).
2. **M2 – Worker integration** with CLIP lookup + tie-break; sample tests green.
3. **M3 – CI & Docs**: automated test, README update, cost analysis.
4. **M4 – Production flag** rolled on; monitor match-rate + error budget for 1 week.

---
Once M4 is stable we can revisit fancy escalations (Google Vision / GPT-4o) and condition grading. 

## 7. Success Criteria & Test Matrix

| ID | Category | Metric / Expectation | Test Method |
|----|----------|----------------------|-------------|
| S1 | Unit – crop match | All fixtures in `worker/test_fixtures/*.jpg` resolve to expected `card_id` with `sim ≥ 0.90`. | `pytest __tests__/ocr/test_clip_pipeline.py` |
| S2 | Regression | No existing green fixture ever flips to red (CI gate). | GitHub Action runs on every PR |
| S3 | Latency | End-to-end worker processes 9-crop binder page in **< 3 s** on Render 2 vCPU instance. | `pytest __tests__/perf/test_latency.py` (marks failure if >3 s) |
| S4 | Match-Rate | On staging dataset of last 100 scans, **≥ 85 %** of detections autolink without manual review. | `scripts/eval_match_rate.py` prints rate – CI passes if ≥85 %. |
| S5 | False Positive | Wrong-card rate **< 1 %** (manual spot-check or labelled sample). | Human QA sample; tracked in Notion. |
| S6 | Storage | Embeddings table size < **300 MB** compressed. | `SELECT pg_size_pretty(pg_total_relation_size('card_embeddings'));` |

### Test File Stubs (to be implemented)

```
__tests__/ocr/test_clip_pipeline.py   # asserts S1 using pgvector query
__tests__/perf/test_latency.py        # measures wall-clock time for worker on sample binder page
scripts/eval_match_rate.py            # batch evaluation against staging scans
```

CI workflow jobs will fail if any of S1–S3 criteria are not met (S4–S6 reported as metrics). 