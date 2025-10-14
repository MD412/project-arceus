#!/usr/bin/env python3
"""
Slim a YOLO/Ultralytics checkpoint by removing training-only state and optionally
converting weights to FP16. The original file is never modified.

Usage examples:
  python scripts/slim_yolo_checkpoint.py --input worker/pokemon_cards_trained.pt --output worker/pokemon_cards_slim_fp16.pt --fp16
  python scripts/slim_yolo_checkpoint.py --input worker/yolov8s.pt --output worker/yolov8s_slim.pt

This script attempts two strategies:
  1) Preferred: Use Ultralytics to load and export a minimal .pt
  2) Fallback: Load with torch, strip non-weight keys, optionally cast to fp16

It prints before/after file sizes to help validate the reduction.
"""
import argparse
import os
import sys
import tempfile
from pathlib import Path


def sizeof_mb(path: Path) -> float:
    try:
        return round(path.stat().st_size / (1024 * 1024), 2)
    except FileNotFoundError:
        return -1.0


def try_ultralytics_export(input_path: Path, output_path: Path, fp16: bool) -> bool:
    try:
        from ultralytics import YOLO  # type: ignore
    except Exception:
        return False
    try:
        model = YOLO(str(input_path))
        # Ultralytics export returns path(s); ensure parent exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        tmpdir = tempfile.mkdtemp()
        exported = model.export(
            format="pt",
            half=fp16,
            simplify=True,
            imgsz=640,
            project=tmpdir,
            name="export",
            exist_ok=True,
            opset=12,
        )
        # Ultralytics returns a path or list; resolve it
        exp_path = Path(exported) if isinstance(exported, (str, Path)) else None
        if exp_path and exp_path.exists():
            output_path.write_bytes(exp_path.read_bytes())
            return True
        # Some versions place file at tmpdir/export/weights/best.pt
        candidate = Path(tmpdir) / "export" / "weights" / "best.pt"
        if candidate.exists():
            output_path.write_bytes(candidate.read_bytes())
            return True
    except Exception:
        return False
    return False


def slim_with_torch(input_path: Path, output_path: Path, fp16: bool) -> bool:
    try:
        import torch  # type: ignore
    except Exception as e:
        print(f"[ERROR] torch not available for fallback slimming: {e}")
        return False

    try:
        ckpt = torch.load(str(input_path), map_location="cpu")
    except Exception as e:
        print(f"[ERROR] Failed to load checkpoint: {e}")
        return False

    # Heuristics: Ultralytics checkpoints often have keys like 'model', 'ema', 'optimizer', etc.
    state_dict = None

    if isinstance(ckpt, dict):
        if "model" in ckpt and hasattr(ckpt["model"], "state_dict"):
            state_dict = ckpt["model"].state_dict()
        elif "state_dict" in ckpt and isinstance(ckpt["state_dict"], dict):
            state_dict = ckpt["state_dict"]
        elif all(isinstance(k, str) and hasattr(v, "shape") for k, v in ckpt.items()):
            # Looks like a plain state dict
            state_dict = ckpt  # type: ignore
    # Last resort: if object itself looks like a module with state_dict
    if state_dict is None and hasattr(ckpt, "state_dict"):
        try:
            state_dict = ckpt.state_dict()  # type: ignore
        except Exception:
            state_dict = None

    if state_dict is None:
        print("[ERROR] Could not locate a state_dict in the checkpoint. Aborting.")
        return False

    # Cast to fp16 if requested and safe
    cleaned = {}
    for k, v in state_dict.items():
        try:
            if fp16 and hasattr(v, "dtype") and str(v.dtype) == "torch.float32":
                cleaned[k] = v.half()
            else:
                cleaned[k] = v
        except Exception:
            cleaned[k] = v

    # Save only the state dict in a compact container
    output_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        torch.save({"state_dict": cleaned}, str(output_path))
        return True
    except Exception as e:
        print(f"[ERROR] Failed to save slimmed checkpoint: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Slim a YOLO checkpoint (.pt)")
    parser.add_argument("--input", required=True, help="Path to source .pt checkpoint")
    parser.add_argument("--output", required=True, help="Path to write slimmed .pt")
    parser.add_argument("--fp16", action="store_true", help="Convert float32 tensors to float16 to reduce size")
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    output_path = Path(args.output).resolve()

    if not input_path.exists():
        print(f"[ERROR] Input not found: {input_path}")
        sys.exit(1)

    before = sizeof_mb(input_path)
    print(f"[INFO] Input: {input_path} ({before} MB)")

    # Strategy 1: Ultralytics export (best)
    ok = try_ultralytics_export(input_path, output_path, fp16=args.fp16)
    if not ok:
        print("[WARN] Ultralytics export failed or unavailable. Falling back to raw torch slimming...")
        ok = slim_with_torch(input_path, output_path, fp16=args.fp16)

    if not ok:
        print("[ERROR] Failed to produce a slimmed checkpoint.")
        sys.exit(2)

    after = sizeof_mb(output_path)
    print(f"[OK] Output: {output_path} ({after} MB)")
    if before > 0 and after > 0:
        pct = round(100.0 * (1.0 - after / before), 2)
        print(f"[STATS] Size reduction: {pct}%")


if __name__ == "__main__":
    main()
