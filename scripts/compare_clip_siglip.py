#!/usr/bin/env python3
"""
Compare CLIP vs SigLIP performance on training data
"""
import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, List
from datetime import datetime
from PIL import Image

# Add worker directory to path for imports
sys.path.append(str(Path(__file__).parent.parent / "worker"))

from clip_lookup import CLIPCardIdentifier
from siglip_identifier import SigLIPCardIdentifier
from config import get_supabase_client

def load_training_data(data_dir: str = "training_data/card_crops") -> Dict[str, List[str]]:
    """Load training data organized by category"""
    data_path = Path(data_dir)
    categories = {}
    
    for category_dir in data_path.iterdir():
        if category_dir.is_dir():
            category_name = category_dir.name
            image_files = []
            for img_file in category_dir.glob("*.jpg"):
                image_files.append(str(img_file))
            for img_file in category_dir.glob("*.jpeg"):
                image_files.append(str(img_file))
            for img_file in category_dir.glob("*.png"):
                image_files.append(str(img_file))
            categories[category_name] = image_files
    
    return categories

def evaluate_model(identifier, image_paths: List[str], category_name: str, model_name: str) -> Dict:
    """Evaluate a specific model on a category"""
    total = len(image_paths)
    correct = 0
    results = []
    start_time = time.time()
    
    print(f"Evaluating {model_name} on {category_name}: {total} images")
    
    for i, img_path in enumerate(image_paths):
        try:
            # Load and identify image
            image = Image.open(img_path)
            result = identifier.identify_card_from_crop(image, similarity_threshold=0.75)
            
            # Determine if identification was correct based on category
            is_correct = False
            if category_name == "correct":
                is_correct = result.get("success", False) and result.get("confidence", 0) > 0.75
            elif category_name == "not_a_card":
                is_correct = not result.get("success", False) or result.get("confidence", 0) < 0.6
            elif category_name == "missing_from_db":
                # These should be identified but may not be in DB
                is_correct = result.get("success", False)
            elif category_name == "wrong_id":
                # These should be identified correctly
                is_correct = result.get("success", False) and result.get("confidence", 0) > 0.75
            
            if is_correct:
                correct += 1
            
            results.append({
                "image": img_path,
                "result": result,
                "expected_category": category_name,
                "is_correct": is_correct
            })
            
            if (i + 1) % 10 == 0:
                print(f"  Processed {i + 1}/{total}")
                
        except Exception as e:
            print(f"Error processing {img_path}: {e}")
            results.append({
                "image": img_path,
                "error": str(e),
                "expected_category": category_name,
                "is_correct": False
            })
    
    accuracy = correct / total if total > 0 else 0
    elapsed_time = time.time() - start_time
    
    return {
        "model": model_name,
        "category": category_name,
        "total": total,
        "correct": correct,
        "accuracy": accuracy,
        "elapsed_time": elapsed_time,
        "avg_time_per_image": elapsed_time / total if total > 0 else 0,
        "results": results
    }

def main():
    print("=== CLIP vs SigLIP Comparison ===")
    
    # Initialize Supabase client
    print("Initializing Supabase client...")
    supabase_client = get_supabase_client()
    
    # Initialize both models
    print("Initializing CLIP...")
    clip_identifier = CLIPCardIdentifier(supabase_client=supabase_client)
    
    print("Initializing SigLIP...")
    siglip_identifier = SigLIPCardIdentifier(supabase_client=supabase_client)
    
    # Load training data
    print("Loading training data...")
    categories = load_training_data()
    
    if not categories:
        print("No training data found!")
        return
    
    print(f"Found categories: {list(categories.keys())}")
    
    # Evaluate both models
    all_results = {}
    
    for category_name, image_paths in categories.items():
        if image_paths:  # Only evaluate non-empty categories
            print(f"\n=== Evaluating {category_name} ===")
            
            # Test CLIP
            clip_result = evaluate_model(clip_identifier, image_paths, category_name, "CLIP")
            all_results[f"CLIP_{category_name}"] = clip_result
            
            # Test SigLIP
            siglip_result = evaluate_model(siglip_identifier, image_paths, category_name, "SigLIP")
            all_results[f"SigLIP_{category_name}"] = siglip_result
    
    # Calculate overall statistics
    clip_results = {k: v for k, v in all_results.items() if k.startswith("CLIP_")}
    siglip_results = {k: v for k, v in all_results.items() if k.startswith("SigLIP_")}
    
    # Print comparison
    print("\n=== COMPARISON RESULTS ===")
    
    for category_name in categories.keys():
        if f"CLIP_{category_name}" in clip_results and f"SigLIP_{category_name}" in siglip_results:
            clip_acc = clip_results[f"CLIP_{category_name}"]["accuracy"]
            siglip_acc = siglip_results[f"SigLIP_{category_name}"]["accuracy"]
            improvement = siglip_acc - clip_acc
            
            print(f"\n{category_name}:")
            print(f"  CLIP:    {clip_acc:.2%}")
            print(f"  SigLIP:  {siglip_acc:.2%}")
            print(f"  Δ:       {improvement:+.2%}")
    
    # Overall accuracy comparison
    clip_total = sum(r["total"] for r in clip_results.values())
    clip_correct = sum(r["correct"] for r in clip_results.values())
    clip_overall = clip_correct / clip_total if clip_total > 0 else 0
    
    siglip_total = sum(r["total"] for r in siglip_results.values())
    siglip_correct = sum(r["correct"] for r in siglip_results.values())
    siglip_overall = siglip_correct / siglip_total if siglip_total > 0 else 0
    
    overall_improvement = siglip_overall - clip_overall
    
    print(f"\n=== OVERALL COMPARISON ===")
    print(f"CLIP Overall:    {clip_overall:.2%} ({clip_correct}/{clip_total})")
    print(f"SigLIP Overall:  {siglip_overall:.2%} ({siglip_correct}/{siglip_total})")
    print(f"Improvement:     {overall_improvement:+.2%}")
    
    # Performance comparison
    clip_avg_time = sum(r["avg_time_per_image"] for r in clip_results.values()) / len(clip_results) if clip_results else 0
    siglip_avg_time = sum(r["avg_time_per_image"] for r in siglip_results.values()) / len(siglip_results) if siglip_results else 0
    
    print(f"\n=== PERFORMANCE ===")
    print(f"CLIP avg time:   {clip_avg_time:.3f}s per image")
    print(f"SigLIP avg time: {siglip_avg_time:.3f}s per image")
    print(f"Speed ratio:     {clip_avg_time/siglip_avg_time:.2f}x" if siglip_avg_time > 0 else "N/A")
    
    # Save detailed results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"clip_siglip_comparison_{timestamp}.json"
    
    with open(results_file, "w") as f:
        json.dump({
            "timestamp": timestamp,
            "clip_overall_accuracy": clip_overall,
            "siglip_overall_accuracy": siglip_overall,
            "improvement": overall_improvement,
            "clip_avg_time": clip_avg_time,
            "siglip_avg_time": siglip_avg_time,
            "results": all_results
        }, f, indent=2)
    
    print(f"\nDetailed results saved to: {results_file}")
    
    # Recommendation
    print(f"\n=== RECOMMENDATION ===")
    if overall_improvement > 0.05:  # 5% improvement threshold
        print("✅ SigLIP shows significant improvement! Consider switching.")
    elif overall_improvement > 0.02:  # 2% improvement threshold
        print("✅ SigLIP shows moderate improvement. Worth considering.")
    else:
        print("⚠️  SigLIP improvement is minimal. CLIP may be sufficient for now.")

if __name__ == "__main__":
    main() 