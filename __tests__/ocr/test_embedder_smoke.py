import time
import sys
import pathlib
import numpy as np
from PIL import Image, ImageDraw

# Ensure project root on path for worker package import
project_root = pathlib.Path(__file__).resolve().parents[2]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from worker.openclip_embedder import build_default_embedder


def _make_dummy_img(sz=512):
    img = Image.new("RGB", (sz, sz), (30, 30, 30))
    d = ImageDraw.Draw(img)
    d.rectangle([60, 100, sz - 60, sz - 120], outline=(200, 180, 50), width=6)
    d.text((sz // 3, sz // 3), "Pikachu", fill=(240, 240, 240))
    return img


def test_embedder_shape_and_norm():
    emb = build_default_embedder()
    img = _make_dummy_img(640)

    v = emb.embed(img, tta_views=2)
    assert isinstance(v, np.ndarray)
    assert v.shape[0] in (768, emb.embed_dim)
    norm = float(np.linalg.norm(v))
    assert 0.99 <= norm <= 1.01, f"Expected L2≈1.0, got {norm}"


def test_deterministic_and_timing():
    emb = build_default_embedder()
    img = _make_dummy_img(336)

    t0 = time.time()
    v1 = emb.embed(img, tta_views=2)
    t1 = time.time()
    v2 = emb.embed(img, tta_views=2)
    t2 = time.time()

    assert np.allclose(v1, v2, atol=1e-6), "Embeddings should be deterministic"

    cpu_ms = int((t1 - t0) * 1000)
    cpu_ms2 = int((t2 - t1) * 1000)
    print(f"[smoke] embed timings: {cpu_ms} ms, {cpu_ms2} ms")



