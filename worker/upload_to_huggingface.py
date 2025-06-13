#!/usr/bin/env python3
"""
Upload trained model to Hugging Face Hub.
Run this once to upload your pokemon_cards_trained.pt model.
"""

import os
from pathlib import Path
from huggingface_hub import HfApi, upload_file
import sys

# Configuration
HF_USERNAME = "zanzoy"
HF_REPO_NAME = "alkzm"
MODEL_FILE = "pokemon_cards_trained.pt"

def upload_model():
    """Upload the trained model to Hugging Face."""
    
    # Check if model file exists
    model_path = Path(__file__).parent / MODEL_FILE
    if not model_path.exists():
        print(f"❌ Model file {MODEL_FILE} not found in {model_path.parent}")
        print("Make sure the model file is in the worker directory.")
        return False
    
    # Check for HF token
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        print("❌ HF_TOKEN environment variable not set.")
        print("Get your token from: https://huggingface.co/settings/tokens")
        print("Then run: export HF_TOKEN=your_token_here")
        return False
    
    try:
        print(f"🔄 Uploading {MODEL_FILE} to Hugging Face...")
        print(f"Repository: {HF_USERNAME}/{HF_REPO_NAME}")
        
        # Upload the file
        upload_file(
            path_or_fileobj=str(model_path),
            path_in_repo=MODEL_FILE,
            repo_id=f"{HF_USERNAME}/{HF_REPO_NAME}",
            token=hf_token,
            repo_type="model"
        )
        
        print("✅ Upload successful!")
        print(f"Model available at: https://huggingface.co/{HF_USERNAME}/{HF_REPO_NAME}")
        print(f"Direct download URL: https://huggingface.co/{HF_USERNAME}/{HF_REPO_NAME}/resolve/main/{MODEL_FILE}")
        
        return True
        
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return False

def create_model_card():
    """Create a basic model card for the repository."""
    model_card_content = f"""---
license: mit
tags:
- computer-vision
- object-detection
- yolo
- pokemon-cards
---

# Pokemon Card Detection Model

This is a YOLOv8 model trained to detect Pokemon cards in images.

## Model Details

- **Base Model**: YOLOv8s
- **Task**: Object Detection
- **Domain**: Pokemon Trading Cards
- **Framework**: Ultralytics YOLOv8

## Usage

```python
from ultralytics import YOLO

# Load the model
model = YOLO('pokemon_cards_trained.pt')

# Run inference
results = model('path/to/your/image.jpg')
```

## Training Data

This model was trained on a custom dataset of Pokemon card images.

## Performance

The model is optimized for detecting Pokemon cards in various lighting conditions and angles.
"""
    
    try:
        # Save model card locally
        readme_path = Path(__file__).parent / "README.md"
        with open(readme_path, 'w') as f:
            f.write(model_card_content)
        
        print(f"✅ Model card created: {readme_path}")
        print("You can upload this README.md to your Hugging Face repo for documentation.")
        
    except Exception as e:
        print(f"⚠️  Failed to create model card: {e}")

if __name__ == "__main__":
    print("🚀 Pokemon Card Model Upload Tool")
    print("=" * 40)
    
    # Create model card
    create_model_card()
    
    # Upload model
    success = upload_model()
    
    if success:
        print("\n🎉 All done! Your model is now available on Hugging Face.")
        print("You can now use the download_models.py script to fetch it anywhere.")
    else:
        print("\n💡 Next steps:")
        print("1. Get your HF token: https://huggingface.co/settings/tokens")
        print("2. Set environment variable: export HF_TOKEN=your_token")
        print("3. Run this script again")
        sys.exit(1) 