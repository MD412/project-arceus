#!/usr/bin/env python3
"""
Quick YOLO training script for Pokemon card detection
Day 0 mini-benchmark: 10 epochs to see if approach is viable
"""

from ultralytics import YOLO
import os
from pathlib import Path

def train_pokemon_card_detector():
    """Train YOLOv8 on the annotated binder dataset"""
    
    # Paths
    data_yaml = Path(__file__).parent / "data.yaml"
    
    print("🚀 Starting Pokemon Card Detection Training")
    print(f"📁 Dataset: {data_yaml}")
    
    # Load a pretrained YOLOv8 small model
    model = YOLO('yolov8s.pt')  # Will download if not present
    
    # Train the model (mini-benchmark: just 10 epochs)
    print("\n🎯 Training for 10 epochs (mini-benchmark)...")
    results = model.train(
        data=str(data_yaml),
        epochs=10,
        imgsz=640,
        batch=16,
        patience=3,  # Early stopping
        save=True,
        name='pokemon_cards_v1',
        verbose=True
    )
    
    print("\n✅ Training complete!")
    print(f"📊 Results saved to: runs/detect/pokemon_cards_v1/")
    
    # Quick validation on the val set
    print("\n🔍 Running validation...")
    val_results = model.val()
    
    print(f"\n📈 Validation Results:")
    print(f"   mAP50: {val_results.box.map50:.3f}")
    print(f"   mAP50-95: {val_results.box.map:.3f}")
    print(f"   Precision: {val_results.box.mp:.3f}")
    print(f"   Recall: {val_results.box.mr:.3f}")
    
    # Save the best model to a predictable location
    best_model_path = Path("runs/detect/pokemon_cards_v1/weights/best.pt")
    print(f"\n💾 Best model saved to: {best_model_path}")
    
    return model, val_results

if __name__ == "__main__":
    model, results = train_pokemon_card_detector()
    
    print("\n🎉 Mini-benchmark complete!")
    print("Next steps:")
    print("1. Test the model on 3 held-out binder photos")
    print("2. If recall > 85%, proceed with more annotations")
    print("3. If recall < 85%, consider VLM fallback") 