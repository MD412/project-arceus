#!/usr/bin/env python3
"""
Quick test of retrieval v2 accuracy on fixture crops.
"""
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "worker"))

from PIL import Image

# Import from worker directory
WORKER_DIR = PROJECT_ROOT / "worker"
sys.path.insert(0, str(WORKER_DIR))

from retrieval_v2 import identify_v2
from config import get_supabase_client

FIXTURES = PROJECT_ROOT / "__tests__" / "ocr" / "fixtures"

def main():
    print("\n[INFO] Testing Retrieval v2 with ViT-L-14-336 gallery...")
    supabase = get_supabase_client()
    
    test_cases = [
        ("greavard_crop.jpg", "sv3-92", "Greavard"),
        ("pidgeot_ex_crop.jpg", "sv4pt5-194", "Pidgeot ex"),
        ("wugtrio_crop.jpg", "sv3-57", "Wugtrio"),
    ]
    
    correct = 0
    total = len(test_cases)
    
    for filename, expected_id, expected_name in test_cases:
        img_path = FIXTURES / filename
        img = Image.open(img_path)
        
        result = identify_v2(img, supabase, topk=100)  # Must be ≥100 to avoid timeout bug
        
        card_id = result.get("card_id")
        score = result.get("best_score", 0.0)
        template_score = result.get("best_template_score", 0.0)
        proto_score = result.get("best_proto_score")
        thresholded = result.get("thresholded", False)
        
        if thresholded:
            print(f"\n❌ UNKNOWN {filename}:")
            print(f"   Expected: {expected_name} ({expected_id})")
            print(f"   Score: {score:.4f} (below threshold)")
        elif card_id == expected_id:
            print(f"\n✅ CORRECT {filename}:")
            print(f"   Got: {expected_name} ({card_id})")
            print(f"   Fused score: {score:.4f} (template={template_score:.4f}, proto={proto_score:.4f})")
            correct += 1
        else:
            print(f"\n⚠️  WRONG {filename}:")
            print(f"   Expected: {expected_name} ({expected_id})")
            print(f"   Got: {card_id}")
            print(f"   Fused score: {score:.4f} (template={template_score:.4f}, proto={proto_score:.4f})")
    
    accuracy = (correct / total) * 100
    print(f"\n📊 Accuracy: {correct}/{total} ({accuracy:.1f}%)")
    
    if accuracy == 100:
        print("🎉 Perfect score with ViT-L-14-336 gallery!")
    elif accuracy >= 80:
        print("✅ Strong performance!")
    elif accuracy >= 50:
        print("⚠️  Mediocre — need more templates or threshold tuning")
    else:
        print("❌ Poor performance — investigate feature space mismatch")

if __name__ == "__main__":
    main()

