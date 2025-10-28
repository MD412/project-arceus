#!/usr/bin/env python3
"""
Test match_card_templates RPC timing to diagnose timeout issue.
"""
from pathlib import Path
import sys
import time
import numpy as np

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
WORKER_DIR = PROJECT_ROOT / "worker"
sys.path.insert(0, str(WORKER_DIR))

from config import get_supabase_client
from openclip_embedder import build_default_embedder
from PIL import Image

FIXTURES = PROJECT_ROOT / "__tests__" / "ocr" / "fixtures"

def main():
    print("\n[INFO] Testing RPC query performance...")
    supabase = get_supabase_client()
    embedder = build_default_embedder()
    
    # Load test image
    img_path = FIXTURES / "greavard_crop.jpg"
    img = Image.open(img_path)
    
    print(f"\n[INFO] Embedding test image...")
    query_vec = embedder.embed(img, tta_views=2).astype(np.float32)
    
    # Test different TopK values
    for topk in [10, 25, 50, 100, 200]:
        print(f"\n[INFO] Testing TopK={topk}...")
        payload = {
            "qvec": query_vec.tolist(),
            "match_count": topk,
            "set_hint": None,
        }
        
        start = time.time()
        try:
            response = supabase.rpc("match_card_templates", payload).execute()
            elapsed = (time.time() - start) * 1000
            matches = len(response.data or [])
            print(f"  ✅ Success: {matches} matches in {elapsed:.0f}ms")
            
            if matches > 0:
                top = response.data[0]
                print(f"     Top match: {top.get('card_id')} (score={top.get('score', 0):.4f})")
        except Exception as e:
            elapsed = (time.time() - start) * 1000
            print(f"  ❌ Failed after {elapsed:.0f}ms: {e}")

if __name__ == "__main__":
    main()











