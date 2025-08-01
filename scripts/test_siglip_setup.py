#!/usr/bin/env python3
"""
Test SigLIP setup and basic functionality
"""
import sys
from pathlib import Path
import torch
import open_clip
from PIL import Image
import numpy as np

# Add worker directory to path for imports
sys.path.append(str(Path(__file__).parent.parent / "worker"))

def test_torch_cuda():
    """Test PyTorch CUDA availability"""
    print("=== Testing PyTorch CUDA ===")
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"CUDA version: {torch.version.cuda}")
        print(f"GPU device: {torch.cuda.get_device_name(0)}")
        print(f"GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    else:
        print("⚠️  CUDA not available - will use CPU")
    print()

def test_siglip_loading():
    """Test SigLIP model loading"""
    print("=== Testing SigLIP Loading ===")
    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Loading SigLIP on {device}...")
        
        # Load SigLIP model
        model, _, preprocess = open_clip.create_model_and_transforms(
            "google/siglip-so400m-patch14-384", 
            pretrained="webli", 
            device=device
        )
        model.eval()
        print("✅ SigLIP model loaded successfully")
        
        # Test with a dummy image
        dummy_image = Image.new('RGB', (384, 384), color='red')
        processed_image = preprocess(dummy_image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            features = model.encode_image(processed_image)
            features = features / features.norm(dim=-1, keepdim=True)
        
        print(f"✅ Image encoding successful - feature dimension: {features.shape}")
        print(f"✅ Feature norm: {features.norm().item():.4f}")
        
        return True
        
    except Exception as e:
        print(f"❌ SigLIP loading failed: {e}")
        return False

def test_worker_imports():
    """Test worker module imports"""
    print("=== Testing Worker Imports ===")
    try:
        from config import get_supabase_client
        print("✅ Config module imported successfully")
        
        # Test Supabase connection (without actually connecting)
        print("✅ Supabase client function available")
        
        return True
        
    except Exception as e:
        print(f"❌ Worker imports failed: {e}")
        return False

def test_siglip_identifier():
    """Test SigLIP identifier class"""
    print("=== Testing SigLIP Identifier ===")
    try:
        from siglip_identifier import SigLIPCardIdentifier
        print("✅ SigLIP identifier class imported successfully")
        
        # Test initialization (without Supabase client)
        identifier = SigLIPCardIdentifier(supabase_client=None)
        print("✅ SigLIP identifier initialized successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ SigLIP identifier test failed: {e}")
        return False

def main():
    print("=== SigLIP Setup Test ===")
    print()
    
    # Run all tests
    tests = [
        test_torch_cuda,
        test_siglip_loading,
        test_worker_imports,
        test_siglip_identifier
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append(False)
        print()
    
    # Summary
    print("=== Test Summary ===")
    passed = sum(results)
    total = len(results)
    
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("✅ All tests passed! SigLIP is ready to use.")
        print("\nNext steps:")
        print("1. Run: python scripts/evaluate_baseline.py")
        print("2. Run: python scripts/compare_clip_siglip.py")
        print("3. Or run: .\\scripts\\run_baseline_evaluation.ps1")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        print("\nCommon issues:")
        print("- Install PyTorch with CUDA: pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118")
        print("- Install open-clip-torch: pip install open-clip-torch")
        print("- Check GPU drivers and CUDA installation")

if __name__ == "__main__":
    main() 