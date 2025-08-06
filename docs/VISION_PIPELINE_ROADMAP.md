# Project Arceus - Vision Pipeline Roadmap

**Created:** July 16, 2025  
**Horizon:** 90 days (through October 2025)

## A. Objectives

1. **Zero-Cost Baseline**  
   • Maintain CLIP-only mode with ≤ $0.01/day API spend.

2. **90%+ Accurate Identification Without GPT**  
   • Raise CLIP + open-source fallback accuracy from ~85% → 90% across EN & JP cards.

3. **Continuous Enrichment & Feedback Loop**  
   • 100% of confident IDs auto-enriched via pokemontcg.io.  
   • Ambiguous cases flow into Review UI and training pipeline.

4. **Developer Confidence**  
   • End-to-end CI that runs vision unit tests, pipeline integration tests, and Supabase schema lint on every PR.

## B. Milestones & Success Criteria

### M1 – Enrichment Fix (Week of July 21)
✔ CLIP confident IDs always have set_name populated.  
✔ Unit test: given set_code+number, enrichment returns non-null set_name.

### M2 – Open-Source Fallback (Week of July 28 - August 4)
✔ Integrate BLIP-2 or LLaVA fallback for cards where CLIP < 0.60.  
✔ Bench test set of 500 mixed EN/JP crops → ≥ 90% overall top-1 accuracy, ≤ 1s added latency.  
✔ No paid API calls triggered.

### M3 – Review UI Loop (Week of August 4-11)
✔ Ambiguous detections auto-create `pipeline_review_items` rows.  
✔ Review UI shows crop, CLIP guess, BLIP guess; user can confirm/edit.  
✔ "Accept All" closes 95% of rows in one click.

### M4 – Automated Retraining (September 2025)
✔ Nightly job exports corrected crops → fine-tunes lightweight classifier head.  
✔ Weekly accuracy trending report e-mailed/slacked.

### M5 – CI/CD Hard Gate (October 2025)
✔ GitHub action: integration test must hit ≥ 90% accuracy on golden set before merge.  
✔ Database migration checker blocks destructive changes without manual override.

## C. Detailed Task Breakdown

### 1. Enrichment Patch
- Update `HybridCardIdentifierV2` to call `PokemonTCGAPI` when `set_code` & `card_number` present.
- Back-fill `set_name` for existing rows (SQL script).

### 2. Open-Source Fallback
- Add `ENABLE_BLIP_FALLBACK` env flag.
- Write `blip_identifier.py` wrapper (huggingface `Salesforce/blip2-flan-t5-xl`).
- Route: CLIP high-conf → accept · mid-conf → BLIP · low-conf → review.
- Measure latency & accuracy; log to `worker_logs`.

### 3. Review UI
- Extend `/scans/review` to fetch `pipeline_review_items`.
- New tag pills: `CLIP-ONLY`, `BLIP-GUESS`, `MANUAL`.
- Mutation endpoint to confirm card & set training flags.

### 4. Retraining Pipeline
- Nightly script (GitHub Actions or Render cron) collects `is_training_candidate=true` rows.
- Fine-tunes classifier; pushes weights to `models/clip_head_vX.pth`.
- On success, bumps `HIGH_CONFIDENCE_THRESHOLD` if metrics improve.

### 5. CI Enhancements
- `pytest -q __tests__/ocr/test_clip_pipeline.py` (unit).
- `pytest -q __tests__/integration/test_hybrid_integration.py` (pipeline).
- Supabase migration linter (sqlfluff + `supabase db lint`).
- Accuracy golden set stored under `__tests__/fixtures/golden_crops/`.

## D. Automation Test Plan

| Feature           | Test Type | Pass Condition |
|-------------------|-----------|----------------|
| Enrichment Patch  | Unit      | Given `sv1 112/172` → returns `Scarlet & Violet` set_name |
| BLIP Fallback     | Unit      | Mock BLIP returns JSON with confidence field ≥ 0.7 |
| Pipeline Accuracy | Integration | 500-image fixture set ≥ 90% top-1 |
| Review Flow       | E2E (Playwright) | User clicks "Accept All" → rows status = `confirmed` |
| Retraining Job    | Integration | Nightly run creates new `clip_head_v*.pth` & logs accuracy delta |
| CI Gate           | Pipeline   | All above tests green + accuracy metric ≥ threshold |

## E. Risks & Mitigations

- **Latency spike with BLIP-2** (slow on CPU) → run on small GPU pod (RunPod secure cloud $0.10/hr).
- **pokemontcg.io API rate limits** → add 100ms back-off & local Redis cache.
- **Supabase storage cost growth** → auto-prune raw uploads after 30 days (keep crops only).

## F. Current Status (July 16, 2025)

✅ **CLIP-only mode implemented** - GPT fallback disabled via `ENABLE_GPT_FALLBACK=false`  
✅ **Cost control achieved** - Zero OpenAI API costs  
🔄 **Issues identified** - Japanese cards, placeholder names, missing set_name enrichment  
✅ **M1 Enrichment Fix completed** - CLIP results now auto-enriched with pokemontcg.io  
⏳ **Next:** M2 Open-Source Fallback

## G. Next Actions

1. ✅ Approve roadmap or modify targets.
2. ✅ Start M1 tasks: code patch for enrichment + back-fill script.
3. ⏳ Spin up GPU pod test environment for BLIP benchmark. 