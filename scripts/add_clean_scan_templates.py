#!/usr/bin/env python3
"""
Add clean scan crops to card_templates to close domain gap.
"""
import sys
import os
import json
import uuid
from pathlib import Path
from PIL import Image
import numpy as np

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from worker.openclip_embedder import build_default_embedder
from worker.config import get_supabase_client

def ensure_unit_vector(vec: np.ndarray) -> np.ndarray:
    """Re-normalize to L2=1.0."""
    norm = np.linalg.norm(vec)
    if not np.isfinite(norm) or norm <= 0:
        raise ValueError("Embedding norm invalid or zero; cannot normalize.")
    return (vec / norm).astype(np.float32)

def main():
    print("🔧 Adding clean scan templates to gallery\n")
    
    embedder = build_default_embedder()
    sb = get_supabase_client()
    
    fixtures_dir = Path("__tests__/ocr/fixtures")
    
    # Load test cases with ground truth
    test_cases = []
    for img_path in fixtures_dir.glob("*.jpg"):
        json_path = img_path.with_suffix(".json")
        if json_path.exists():
            with open(json_path) as f:
                gt = json.load(f)
            test_cases.append((img_path, gt))
    
    print(f"📸 Found {len(test_cases)} clean scans to add\n")
    
    records = []
    for img_path, gt in test_cases:
        print(f"Processing {img_path.name} → {gt['card_id']}...", end=" ")
        
        # Load and embed
        img = Image.open(img_path).convert("RGB")
        emb = embedder.embed(img, tta_views=2)
        emb = ensure_unit_vector(emb)
        
        # Create template record
        template_id = str(uuid.uuid4())
        record = {
            "id": template_id,
            "card_id": gt["card_id"],
            "set_id": gt.get("set_id"),
            "variant": None,
            "source": "clean_scan",
            "aug_tag": None,
            "emb": emb.tolist()
        }
        records.append(record)
        print(f"✅ (sim check: {float(np.dot(emb, emb)):.4f})")
    
    # Upsert to gallery
    print(f"\n📤 Upserting {len(records)} templates to card_templates...")
    sb.table("card_templates").upsert(records, on_conflict="id").execute()
    print("✅ Done!\n")
    
    print("🔄 Next: Rebuild prototypes with `pwsh -File scripts/Build-CardPrototypes.ps1`")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

