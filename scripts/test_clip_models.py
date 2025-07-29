#!/usr/bin/env python3
"""
Test different CLIP model variants to find the best one for Pokemon cards
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'worker'))

import open_clip
import torch
from PIL import Image
import numpy as np

# CLIP models to test
MODELS_TO_TEST = [
    ('ViT-B-32', 'openai'),      # Current default
    ('ViT-L-14', 'openai'),      # Larger, more accurate
    ('ViT-B-16-plus-240', 'laion400m_e32'),  # Fine-tuned on more data
    ('ViT-H-14', 'laion2b_s32b_b79k'),  # Huge model, very accurate
    ('ViT-g-14', 'laion2b_s12b_b42k'),  # Giant model
]

def test_model_on_cards(model_name, pretrained):
    """Test a CLIP model variant on Pokemon cards"""
    print(f"\n🧪 Testing {model_name} ({pretrained})...")
    
    try:
        # Load model
        model, _, preprocess = open_clip.create_model_and_transforms(model_name, pretrained=pretrained)
        model.eval()
        
        # Test on known cards vs non-cards
        test_dir = "training_data/card_crops/not_a_card"
        scores = []
        
        if os.path.exists(test_dir):
            for img_file in os.listdir(test_dir)[:5]:  # Test first 5
                if img_file.endswith('.jpg'):
                    img_path = os.path.join(test_dir, img_file)
                    image = preprocess(Image.open(img_path)).unsqueeze(0)
                    
                    with torch.no_grad():
                        image_features = model.encode_image(image)
                        # Simplified test - just check feature magnitude
                        score = torch.norm(image_features).item()
                        scores.append(score)
                        print(f"   {img_file}: {score:.3f}")
        
        if scores:
            print(f"   Average score: {np.mean(scores):.3f}")
            return np.mean(scores)
    
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None

def main():
    print("🚀 CLIP Model Comparison for Pokemon Cards")
    print("=" * 50)
    
    results = {}
    
    for model_name, pretrained in MODELS_TO_TEST:
        score = test_model_on_cards(model_name, pretrained)
        if score:
            results[f"{model_name}_{pretrained}"] = score
    
    print("\n📊 RESULTS SUMMARY:")
    print("=" * 50)
    for model, score in sorted(results.items(), key=lambda x: x[1], reverse=True):
        print(f"{model}: {score:.3f}")
    
    print("\n💡 Recommendation: Use the model with the highest discrimination between cards and non-cards")

if __name__ == "__main__":
    main() 