#!/usr/bin/env python3
"""Debug why a specific scan isn't matching correctly."""
import sys
import os
from pathlib import Path

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from worker.retrieval_v2 import identify_v2
from worker.config import get_supabase_client
from PIL import Image

def main():
    # Load the Greavard test fixture that we know works
    test_img = Image.open("__tests__/ocr/fixtures/greavard_crop.jpg").convert("RGB")
    
    sb = get_supabase_client()
    
    # Run retrieval v2
    result = identify_v2(test_img, sb, topk=200, set_hint="sv3")
    
    print(f"\n{'='*60}")
    print("GREAVARD TEST FIXTURE RESULTS")
    print(f"{'='*60}")
    
    print(f"\nPredicted: {result.get('card_id', 'UNKNOWN')}")
    print(f"Best score: {result.get('best_score', 0):.4f}")
    print(f"Thresholded: {result.get('thresholded', False)}")
    
    print(f"\nTop 5 candidates:")
    for i, c in enumerate(result.get('candidates', [])[:5], 1):
        marker = "← CORRECT" if c.get('card_id') == 'sv3-92' else ""
        print(f"  {i}. {c.get('card_id')}: {c.get('fused', 0):.4f} {marker}")
    
    # Check if RETRIEVAL_IMPL is set
    import os
    print(f"\n{'='*60}")
    print("ENVIRONMENT CHECK")
    print(f"{'='*60}")
    print(f"RETRIEVAL_IMPL: {os.getenv('RETRIEVAL_IMPL', 'not set')}")
    print(f"UNKNOWN_THRESHOLD: {os.getenv('UNKNOWN_THRESHOLD', 'not set')}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
