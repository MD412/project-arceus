# Expand Pokémon Card Embeddings to Full Set

> Document owner: **AI Ops**  
> Last updated: {{DATE}}

## 1 • Purpose
The production worker currently relies on ~250 CLIP embeddings. This limits
recall and forces manual review on many scans. We will expand the
`card_embeddings` table to **all English Pokémon cards (~15 k)** while keeping the
run-time worker cheap (CPU-only on Render).

## 2 • Current State
| Component | Status |
|-----------|--------|
| `card_embeddings` rows | ≈ 250 |
| ETL script | `scripts/build_card_embeddings.py` (TEST_MODE=true, batch of 50) |
| Worker     | Uses OpenCLIP ViT-B/32 on CPU |
| Accuracy (fixtures) | 100 % on 6/6 but small coverage |

## 3 • Goals & Success Criteria
1. **Coverage** – ≥ 15 000 embeddings or ≥ 99 % of PokémonTCG.io English cards.  
2. **Accuracy** – End-to-end CLIP test suite ≥ 95 % on expanded fixture set.  
3. **Latency** – Avg < 300 ms per scan on Render CPU plan.  
4. **Cost** – No paid OpenAI calls. GPU time for ETL ≤ $1/run (spot VM).  
5. **Automation** – Nightly GitHub Action checks new sets and runs delta ETL.

## 4 • Implementation Plan
### 4.1 One-off Full ETL (local RTX 3080)
1. Pull latest `main` branch.  
2. Edit `scripts/build_card_embeddings.py`:
   ```python
   TEST_MODE = False
   ```
3. (Optional) pass `--delta` flag once implemented to skip existing IDs.
4. Create/activate env with `torch torchvision open-clip-torch` matching GPU CUDA.
5. Run:
   ```bash
   python scripts/build_card_embeddings.py
   ```
6. Monitor logs; expect ≈10–12 min on RTX 3080, success rate ≥ 98 %.

### 4.2 Database Indexes
```sql
create extension if not exists vector;
create index if not exists card_embeddings_clip_idx
  on card_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
```

### 4.3 Weekly Delta Job (GitHub Action)
1. Curl the PokémonTCG bulk file and compare `ETag` to last stored hash.  
2. If new, spin-up GPU runner (RunPod/Vast.ai) → run same script with `--delta`.  
3. Post Slack/Discord message with new cards embedded and success rate.

### 4.4 Worker Changes
None. Worker already queries `card_embeddings`; larger table just works.

## 5 • Risk & Mitigation
| Risk | Mitigation |
|------|------------|
| API rate-limit | 0.1 s sleep/page, retries ×3 |
| Spot GPU unavailable | Fallback to local RTX 3080 |
| Storage size | 15 k × 512 floats ≈ 30 MB – OK |
| Render memory | Load embeddings lazily; keep under 512 MB |

## 6 • Automated Testing
| Test | Location | Threshold |
|------|----------|-----------|
| CLIP accuracy & performance | `__tests__/ocr/test_clip_automation.py` | ≥ 95 % accuracy, ≤ 300 ms avg |
| Embedding count regression | **NEW** `scripts/check_embeddings_count.py` (TBD) | count ≥ 15 000 |
| CI wrapper | `scripts/test_clip_simple.py --mode ci` | exit 0 |

## 7 • Roll-out Checklist
- [ ] One-off ETL run completed & logs archived.
- [ ] Supabase `card_embeddings` count validated ≥ goal.
- [ ] Query latency re-benchmarked (fixtures & prod).
- [ ] GitHub Action scheduled (`.github/workflows/embed_delta.yml`).
- [ ] Docs updated here after first successful delta run.

---
**Next Review:** 30 days after roll-out or when Pokémon ‘Shrouded Fable’ set drops. 