#!/usr/bin/env python3
"""
Baseline evaluation script for card identification accuracy
Measures current CLIP performance on training data
"""
import os
import sys
import json
from pathlib import Path
from typing import Dict, List, Tuple
from datetime import datetime
import numpy as np
from PIL import Image

# Add worker directory to path for imports
sys.path.append(str(Path(__file__).parent.parent / "worker"))

from clip_lookup import CLIPCardIdentifier
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

def evaluate_category(clip_identifier: CLIPCardIdentifier, 
                     image_paths: List[str], 
                     category_name: str) -> Dict:
    """Evaluate accuracy for a specific category"""
    total = len(image_paths)
    correct = 0
    results = []
    
    print(f"Evaluating {category_name}: {total} images")
    
    for i, img_path in enumerate(image_paths):
        try:
            # Load and identify image
            image = Image.open(img_path)
            result = clip_identifier.identify_card_from_crop(image, similarity_threshold=0.75)
            
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
    return {
        "category": category_name,
        "total": total,
        "correct": correct,
        "accuracy": accuracy,
        "results": results
    }

def main():
    print("=== Baseline CLIP Evaluation ===")
    
    # Initialize CLIP identifier
    print("Initializing CLIP identifier...")
    supabase_client = get_supabase_client()
    clip_identifier = CLIPCardIdentifier(supabase_client=supabase_client)
    
    # Load training data
    print("Loading training data...")
    categories = load_training_data()
    
    if not categories:
        print("No training data found!")
        return
    
    print(f"Found categories: {list(categories.keys())}")
    
    # Evaluate each category
    all_results = {}
    total_images = 0
    total_correct = 0
    
    for category_name, image_paths in categories.items():
        if image_paths:  # Only evaluate non-empty categories
            result = evaluate_category(clip_identifier, image_paths, category_name)
            all_results[category_name] = result
            total_images += result["total"]
            total_correct += result["correct"]
    
    # Calculate overall accuracy
    overall_accuracy = total_correct / total_images if total_images > 0 else 0
    
    # Print results
    print("\n=== EVALUATION RESULTS ===")
    print(f"Overall Accuracy: {overall_accuracy:.2%} ({total_correct}/{total_images})")
    print()
    
    for category, result in all_results.items():
        print(f"{category}: {result['accuracy']:.2%} ({result['correct']}/{result['total']})")
    
    # Save detailed results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"baseline_evaluation_{timestamp}.json"
    
    with open(results_file, "w") as f:
        json.dump({
            "timestamp": timestamp,
            "overall_accuracy": overall_accuracy,
            "total_images": total_images,
            "total_correct": total_correct,
            "categories": all_results
        }, f, indent=2)
    
    print(f"\nDetailed results saved to: {results_file}")
    
    # Print some example failures for analysis
    print("\n=== EXAMPLE FAILURES ===")
    for category, result in all_results.items():
        failures = [r for r in result["results"] if not r.get("is_correct", True)]
        if failures:
            print(f"\n{category} failures:")
            for failure in failures[:3]:  # Show first 3 failures
                print(f"  {failure['image']}: {failure.get('result', {}).get('error', 'No result')}")

if __name__ == "__main__":
    main() 