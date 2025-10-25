#!/usr/bin/env python3
"""
Quick sanity test: Verify embedder produces higher similarity for same card than random cards.
"""
import sys
import os
import json
from pathlib import Path
import numpy as np
from PIL import Image

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from worker.openclip_embedder import build_default_embedder
from worker.config import get_supabase_client

def main():
    print("🧪 Embedder Sanity Test\n")
    
    # Initialize
    embedder = build_default_embedder()
    sb = get_supabase_client()
    
    # Load test crop for sv3-92 (Greavard)
    crop_path = Path("__tests__/ocr/fixtures/greavard_crop.jpg")
    crop_img = Image.open(crop_path).convert("RGB")
    crop_emb = embedder.embed(crop_img, tta_views=2).astype(np.float32)
    
    print(f"📸 Crop embedding: shape={crop_emb.shape}, norm={np.linalg.norm(crop_emb):.4f}")
    
    # Fetch gallery templates for sv3-92
    result = sb.table('card_templates').select('id, card_id, emb').eq('card_id', 'sv3-92').limit(3).execute()
    
    if not result.data:
        print("❌ No templates found for sv3-92!")
        return 1
    
    print(f"\n✅ Found {len(result.data)} templates for sv3-92\n")
    
    sims_correct = []
    for row in result.data:
        emb_raw = row['emb']
        # Parse vector (may be string or list)
        if isinstance(emb_raw, str):
            emb = np.array(json.loads(emb_raw.strip()), dtype=np.float32)
        else:
            emb = np.array(emb_raw, dtype=np.float32)
        sim = float(np.dot(crop_emb, emb))
        sims_correct.append(sim)
        print(f"   Template {row['id'][:8]}...: similarity = {sim:.4f}")
    
    # Fetch random other cards
    result_random = sb.table('card_templates').select('id, card_id, emb').neq('card_id', 'sv3-92').limit(5).execute()
    
    print(f"\n🎲 Random other cards:\n")
    sims_random = []
    for row in result_random.data:
        emb_raw = row['emb']
        # Parse vector (may be string or list)
        if isinstance(emb_raw, str):
            emb = np.array(json.loads(emb_raw.strip()), dtype=np.float32)
        else:
            emb = np.array(emb_raw, dtype=np.float32)
        sim = float(np.dot(crop_emb, emb))
        sims_random.append(sim)
        print(f"   {row['card_id']}: similarity = {sim:.4f}")
    
    print(f"\n{'='*60}")
    print(f"📊 Summary:")
    print(f"   Correct card (sv3-92) avg similarity: {np.mean(sims_correct):.4f}")
    print(f"   Random cards avg similarity: {np.mean(sims_random):.4f}")
    print(f"   Gap: {np.mean(sims_correct) - np.mean(sims_random):.4f}")
    
    if np.mean(sims_correct) > np.mean(sims_random):
        print(f"\n✅ PASS: Correct card beats random cards (embedder working)")
    else:
        print(f"\n❌ FAIL: Correct card NOT distinguishable (check embedder/preprocessing)")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

