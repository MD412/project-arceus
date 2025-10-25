#!/usr/bin/env python3
"""
Lightweight check for retrieval v2 pipeline.

Given an image crop, this script runs the gallery ANN + prototype fusion path
and prints the top-5 candidates with fused/template/prototype scores.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    from worker.config import (  # type: ignore  # noqa: E402
        get_supabase_client,
        RETRIEVAL_TOPK,
        UNKNOWN_THRESHOLD,
    )
    from worker.retrieval_v2 import identify_v2  # type: ignore  # noqa: E402
except Exception:
    # Fallback: ensure project root is on path and import from worker package
    if str(PROJECT_ROOT) not in sys.path:
        sys.path.insert(0, str(PROJECT_ROOT))
    from worker.config import (  # type: ignore  # noqa: E402
        get_supabase_client,
        RETRIEVAL_TOPK,
        UNKNOWN_THRESHOLD,
    )
    from worker.retrieval_v2 import identify_v2  # type: ignore  # noqa: E402


def _load_image(path: Path) -> Image.Image:
    if not path.exists():
        raise FileNotFoundError(f"Image path not found: {path}")
    return Image.open(path).convert("RGB")


def main() -> None:
    parser = argparse.ArgumentParser(description="Dry-run retrieval_v2 for a single image.")
    parser.add_argument("image_path", type=Path, help="Path to the crop image.")
    parser.add_argument("--set-id", dest="set_id", help="Optional set hint to pass to ANN search.")
    parser.add_argument("--topk", type=int, default=RETRIEVAL_TOPK, help="Override TOPK (default from config).")
    args = parser.parse_args()

    image = _load_image(args.image_path)
    supabase = get_supabase_client()

    hint = args.set_id
    result = identify_v2(image, supabase, topk=args.topk, set_hint=hint)

    best_score = result.get("best_score", 0.0)
    card_id = result.get("card_id")
    thresholded = result.get("thresholded", False)

    print("--- Retrieval v2 dry run ---")
    print(f"Image: {args.image_path}")
    print(f"Set hint: {hint or 'None'}")
    print(f"TopK: {args.topk}")
    print(f"Unknown threshold: {UNKNOWN_THRESHOLD:.3f}")
    if card_id:
        print(f"Best card: {card_id} (fused={best_score:.4f})")
    else:
        print(f"No card above threshold ({best_score:.4f}); thresholded={thresholded}")

    print("\nTop candidates:")
    candidates = result.get("candidates", [])
    if not candidates:
        print("  (no candidates returned)")
        return

    for idx, cand in enumerate(candidates, start=1):
        template_score = cand.get("template_score", 0.0)
        proto_score = cand.get("proto_score")
        fused = cand.get("fused", 0.0)
        set_id = cand.get("set_id")
        proto_display = f"{proto_score:.4f}" if proto_score is not None else "n/a"
        print(
            f"{idx:>2}. {cand.get('card_id')}  "
            f"fused={fused:.4f}  "
            f"template={template_score:.4f}  "
            f"proto={proto_display}  "
            f"set={set_id or 'n/a'}"
        )


if __name__ == "__main__":
    main()
