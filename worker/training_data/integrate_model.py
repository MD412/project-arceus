#!/usr/bin/env python3
"""
Integration script to swap the trained model into production pipeline
"""

from pathlib import Path
import shutil

def integrate_trained_model():
    """Copy the trained model to production location and update worker"""
    
    # Paths
    trained_model = Path(r"C:\Users\mdand\Projects\tests\visiontest\runs\detect\pokemon_cards_v1\weights\best.pt")
    production_model = Path("../pokemon_cards_trained.pt")
    worker_file = Path("../production_worker.py")
    
    if not trained_model.exists():
        print("❌ Trained model not found. Run training first.")
        return False
    
    print(f"📦 Copying trained model to production location...")
    shutil.copy2(trained_model, production_model)
    print(f"✅ Model copied to: {production_model}")
    
    print(f"\n📝 To integrate into production pipeline:")
    print(f"Edit {worker_file} around line 43:")
    print(f"")
    print(f"  # OLD:")
    print(f"  MODEL = YOLO('yolov8s.pt')  # Generic model")
    print(f"")
    print(f"  # NEW:")
    print(f"  MODEL = YOLO('pokemon_cards_trained.pt')  # Your trained model")
    print(f"")
    
    print(f"🚀 After making this change:")
    print(f"   1. Restart your production worker")
    print(f"   2. Test with a new binder upload")
    print(f"   3. Check detection accuracy in the UI")
    
    # Show performance comparison template
    print(f"\n📊 Performance Comparison Template:")
    print(f"   Before (Generic YOLO): ~70% accuracy")
    print(f"   After (Trained Model): __%% accuracy  ← Fill this in after testing")
    
    return True

if __name__ == "__main__":
    integrate_trained_model() 