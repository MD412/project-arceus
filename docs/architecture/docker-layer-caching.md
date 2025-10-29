# Docker Layer Caching Best Practices

**Critical:** Understanding Docker layer caching prevents slow rebuilds on every deploy.

---

## How Docker Layers Work

Each `RUN`, `COPY`, `ENV` command = 1 layer in the image.

**Layer caching rules:**
1. If a layer hasn't changed → use cached version (fast)
2. If a layer changes → rebuild that layer + all layers after it (slow)
3. Order matters! Put rarely-changing stuff first.

---

## Anti-Pattern: Code Before Model Download

```dockerfile
# ❌ BAD: Code copy invalidates model cache on every change
COPY worker/*.py ./              # Changes often (every commit)
RUN python -c "download model"   # 934MB download, re-runs every time!
```

**Result:** Every code change = 15 minute model download 💀

---

## Correct Pattern: Model Before Code

```dockerfile
# ✅ GOOD: Model download happens before code copy
RUN python -c "download model"   # 934MB download, cached!
COPY worker/*.py ./              # Changes often, but doesn't affect above layer
```

**Result:** Code changes = instant deploy (uses cached model) ⚡

---

## Project Arceus Dockerfile Order

```dockerfile
# Layer 1-5: System deps + Python packages (cached unless requirements.txt changes)
FROM python:3.11-slim
RUN apt-get install ...
RUN pip install -r requirements.txt

# Layer 6-7: Environment setup (cached, rarely changes)
WORKDIR /app
ENV OPENCLIP_CACHE_DIR=/cache/open_clip

# Layer 8: Download CLIP model (cached, only re-runs if model name changes)
RUN python -c "open_clip.create_model_and_transforms(...)"
# ⚠️ THIS IS THE SLOWEST LAYER (934MB, 10-15 minutes)
# ✅ It's BEFORE code copy, so code changes don't invalidate it!

# Layer 9: Copy worker code (changes frequently)
COPY worker/*.py ./
# ✅ Code changes only rebuild from this layer forward (fast!)

# Layer 10-11: Final setup
RUN mkdir -p /app/output
CMD ["python", "worker.py"]
```

---

## When Model Layer Re-Downloads

**Will re-download (rare):**
- Model name changes (`ViT-B-32-quickgelu` → `ViT-L-14-336`)
- Checkpoint changes (`laion2b_s34b_b79k` → `laion400m_e32`)
- Dockerfile changes ABOVE the model download line
- Render cache purge (manual or after ~30 days)

**Won't re-download (most deploys):**
- Code changes in `worker.py`, `clip_lookup.py`, etc.
- Changes to files copied AFTER model download
- Dependency updates in requirements.txt (in separate stage)

---

## Speed Comparison

### Before Fix (Model After Code):
```
Code change → git push
  ↓
Render builds layers 1-6 (cached, 1 min)
  ↓
Layer 7: Copy code (changed, rebuild)
  ↓
Layer 8: Download model (invalidated, 15 min) 💀
  ↓
Total: 16 minutes per deploy
```

### After Fix (Model Before Code):
```
Code change → git push
  ↓
Render builds layers 1-8 (cached, 1 min)
  ↓
Layer 9: Copy code (changed, rebuild, 5 sec)
  ↓
Layer 10-11: Final setup (10 sec)
  ↓
Total: 75 seconds per deploy ⚡
```

---

## Memory Aid (Factorio Analogy)

**Dockerfile = Assembly line recipe**

❌ Bad recipe:
```
1. Get iron plate (fast, cached)
2. Place blueprint (changes every time, forces re-craft)
3. Craft train (slow, 15 min) ← Has to re-craft every time!
```

✅ Good recipe:
```
1. Get iron plate (fast, cached)
2. Craft train (slow, 15 min) ← Crafted once, stored in chest
3. Place blueprint (changes every time) ← Uses pre-crafted train!
```

---

## Quick Audit Checklist

When editing Dockerfile, ask:
1. ✅ Are expensive operations (downloads, builds) BEFORE code copy?
2. ✅ Are frequently-changing files (code) near the END?
3. ✅ Are ENV vars that affect downloads set BEFORE the download?
4. ✅ Are comments explaining why the order matters?

---

## Current Project Status

✅ **Fixed Oct 29, 2025**
- Model download moved before code copy
- Future code changes won't re-download 934MB model
- Deploy time: 16 min → 75 sec for code changes

**Files:**
- `Dockerfile` lines 47-64: Model download (cached layer)
- `Dockerfile` lines 66-69: Code copy (frequently changes)

---

## Reference Links

- Docker layer caching: https://docs.docker.com/build/cache/
- Multi-stage builds: https://docs.docker.com/build/building/multi-stage/
- Best practices: https://docs.docker.com/develop/dev-best-practices/

---

**TL;DR:** Expensive downloads BEFORE code copy = faster deploys. Order matters!

