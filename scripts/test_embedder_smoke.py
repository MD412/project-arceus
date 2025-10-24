#!/usr/bin/env python3
"""
Embedder Smoke Test

Purpose: Validate OpenCLIP ViT-L/14@336 embedder outputs L2-normalized 768-d vectors
         and runs deterministically with TTA(2).

Exit codes:
  0 => success
  1 => general failure
"""
import sys
import time
import numpy as np
from PIL import Image, ImageDraw

try:
    # Ensure project root on sys.path so 'worker' package can be imported
    import pathlib as _pl
    _project_root = _pl.Path(__file__).resolve().parents[1]
    if str(_project_root) not in sys.path:
        sys.path.insert(0, str(_project_root))
    from worker.openclip_embedder import build_default_embedder
except Exception as e:
    print(f"[ERROR] Failed to import embedder: {e}")
    sys.exit(1)


def make_dummy_img(sz: int = 512) -> Image.Image:
    img = Image.new("RGB", (sz, sz), (30, 30, 30))
    d = ImageDraw.Draw(img)
    d.rectangle([60, 100, sz - 60, sz - 120], outline=(200, 180, 50), width=6)
    d.text((sz // 3, sz // 3), "Pikachu", fill=(240, 240, 240))
    return img


def main() -> int:
    try:
        emb = build_default_embedder()
        img = make_dummy_img(640)

        t0 = time.time()
        v1 = emb.embed(img, tta_views=2)
        t1 = time.time()
        v2 = emb.embed(img, tta_views=2)
        t2 = time.time()

        if not isinstance(v1, np.ndarray):
            print("[ERROR] Embedding is not a numpy array")
            return 1
        if v1.shape[0] not in (768, emb.embed_dim):
            print(f"[ERROR] Unexpected embedding dim: {v1.shape[0]}")
            return 1

        norm = float(np.linalg.norm(v1))
        if not (0.99 <= norm <= 1.01):
            print(f"[ERROR] L2 norm out of range: {norm}")
            return 1

        if not np.allclose(v1, v2, atol=1e-6):
            print("[ERROR] Embeddings are not deterministic across runs")
            return 1

        cpu_ms1 = int((t1 - t0) * 1000)
        cpu_ms2 = int((t2 - t1) * 1000)
        print(f"[smoke] embed timings: {cpu_ms1} ms, {cpu_ms2} ms on {emb.device_str}")
        print("[OK] Embedder smoke test passed")
        return 0
    except Exception as ex:
        print(f"[ERROR] Exception during smoke test: {ex}")
        return 1


if __name__ == "__main__":
    sys.exit(main())


