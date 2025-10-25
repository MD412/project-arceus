#!/usr/bin/env python3
"""Test that the user's actual Greavard scan now works."""
import sys
import os
from PIL import Image
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'worker'))

from retrieval_v2 import identify_v2
from config import get_supabase_client

print("🧪 Testing user's actual Greavard scan\n")

# Load the user's actual scan
img = Image.open('great_tusk_crop.jpg').convert("RGB")
print(f"📸 Loaded user's Greavard scan (previously misidentified as Great Tusk)")

sb = get_supabase_client()

# Run retrieval v2
result = identify_v2(img, sb, topk=200, set_hint="sv3")

print(f"\n{'='*60}")
print("RESULTS")
print(f"{'='*60}")

print(f"\nPredicted: {result.get('card_id', 'UNKNOWN')}")
print(f"Best score: {result.get('best_score', 0):.4f}")
print(f"Thresholded: {result.get('thresholded', False)}")

print(f"\nTop 5 candidates:")
for i, c in enumerate(result.get('candidates', [])[:5], 1):
    cid = c.get('card_id')
    fused = c.get('fused', 0)
    tpl = c.get('template_score', 0)
    proto = c.get('proto_score', 0)
    
    marker = ""
    if cid == 'sv3-92':
        marker = "← ✅ GREAVARD (CORRECT!)"
    elif cid == 'svp-72':
        marker = "← ❌ Great Tusk (OLD WRONG)"
    
    print(f"  {i}. {cid}: fused={fused:.4f}, tpl={tpl:.4f}, proto={proto:.4f} {marker}")

if result.get('card_id') == 'sv3-92':
    print(f"\n✅✅✅ SUCCESS! Your Greavard scan now correctly identifies as sv3-92!")
else:
    print(f"\n⚠️ Still not working... might need to wait for worker redeploy")
