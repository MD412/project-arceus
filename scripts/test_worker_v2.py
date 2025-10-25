#!/usr/bin/env python3
"""Test that worker properly uses retrieval v2."""
import sys
import os

# Set v2 before importing
os.environ['RETRIEVAL_IMPL'] = 'v2'
os.environ['RETRIEVAL_TOPK'] = '200'
os.environ['UNKNOWN_THRESHOLD'] = '0.80'

# Must be before sys.path manipulation
sys.path.insert(0, 'worker')

# Now import worker components
from config import RETRIEVAL_IMPL, RETRIEVAL_TOPK, UNKNOWN_THRESHOLD
print(f"Config loaded: RETRIEVAL_IMPL={RETRIEVAL_IMPL}, TOPK={RETRIEVAL_TOPK}, THRESHOLD={UNKNOWN_THRESHOLD}")

# Try importing retrieval v2
try:
    from retrieval_v2 import identify_v2
    print("✅ Retrieval v2 imported successfully")
    
    # Test on Greavard
    from PIL import Image
    from config import get_supabase_client
    
    img = Image.open("__tests__/ocr/fixtures/greavard_crop.jpg").convert("RGB")
    sb = get_supabase_client()
    
    result = identify_v2(img, sb, topk=200)
    print(f"\n✅ identify_v2 works!")
    print(f"   Predicted: {result.get('card_id', 'UNKNOWN')}")
    print(f"   Score: {result.get('best_score', 0):.4f}")
    
except ImportError as e:
    print(f"❌ Failed to import retrieval_v2: {e}")
    sys.exit(1)

# Check worker's USE_RETRIEVAL_V2 flag
sys.path.insert(0, '.')
os.chdir('worker')
import worker

print(f"\n✅ Worker USE_RETRIEVAL_V2 = {worker.USE_RETRIEVAL_V2}")

if not worker.USE_RETRIEVAL_V2:
    print("❌ Worker not configured to use v2!")
    sys.exit(1)
    
print("\n✅ All checks passed - worker ready to use retrieval v2!")
