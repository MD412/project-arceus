#!/usr/bin/env python3
"""
Test script to evaluate the trained Pokemon card detection model
"""

from ultralytics import YOLO
from pathlib import Path
import cv2
import matplotlib.pyplot as plt

def test_trained_model():
    """Test the trained model on validation images"""
    
    # Path to the trained model
    model_path = Path(r"C:\Users\mdand\Projects\tests\visiontest\runs\detect\pokemon_cards_v1\weights\best.pt")
    
    if not model_path.exists():
        print("❌ Trained model not found. Make sure training completed successfully.")
        print(f"Expected path: {model_path}")
        return
    
    print(f"📊 Loading trained model from: {model_path}")
    model = YOLO(str(model_path))
    
    # Test on validation images
    val_images_dir = Path("valid/images")
    val_images = list(val_images_dir.glob("*.jpg"))
    
    print(f"\n🔍 Testing on {len(val_images)} validation images...")
    
    total_cards_expected = 0
    total_cards_detected = 0
    
    for i, image_path in enumerate(val_images):
        print(f"\n📷 Image {i+1}: {image_path.name}")
        
        # Run inference
        results = model.predict(str(image_path), conf=0.25, save=False, verbose=False)
        
        # Count detections
        num_detections = len(results[0].boxes) if results[0].boxes is not None else 0
        print(f"   🎯 Detected: {num_detections} cards")
        
        total_cards_detected += num_detections
        
        # For manual verification, we'll estimate expected cards
        # (In a real scenario, we'd have ground truth labels)
        
        # Save prediction image for visual inspection
        pred_image = results[0].plot()
        output_path = f"test_results_image_{i+1}.jpg"
        cv2.imwrite(output_path, pred_image)
        print(f"   💾 Saved prediction to: {output_path}")
    
    print(f"\n📈 Summary:")
    print(f"   Total images tested: {len(val_images)}")
    print(f"   Total cards detected: {total_cards_detected}")
    print(f"   Average cards per image: {total_cards_detected / len(val_images):.1f}")
    
    # Run formal validation metrics
    print(f"\n🔍 Running formal validation...")
    val_results = model.val()
    
    print(f"\n📊 Validation Metrics:")
    print(f"   mAP50: {val_results.box.map50:.3f}")
    print(f"   mAP50-95: {val_results.box.map:.3f}")
    print(f"   Precision: {val_results.box.mp:.3f}")
    print(f"   Recall: {val_results.box.mr:.3f}")
    
    # Success criteria
    recall = val_results.box.mr
    precision = val_results.box.mp
    
    print(f"\n🎯 Mini-Benchmark Results:")
    if recall >= 0.85:
        print(f"✅ SUCCESS: Recall ({recall:.3f}) >= 0.85 threshold")
        print("   → Proceed with annotating more images (up to 50 total)")
    else:
        print(f"⚠️  MARGINAL: Recall ({recall:.3f}) < 0.85 threshold")
        print("   → Consider annotating 10 more images or prepare VLM fallback")
    
    if precision >= 0.80:
        print(f"✅ Good precision: {precision:.3f}")
    else:
        print(f"⚠️  Low precision: {precision:.3f} (many false positives)")
    
    return val_results

if __name__ == "__main__":
    test_trained_model() 