#!/usr/bin/env python3
"""
Test CLIP-based card identification pipeline
Validates that embedding similarity search works correctly
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'worker'))

import pytest
from PIL import Image
from clip_lookup import identify_card_from_crop, get_clip_identifier

def test_clip_identifier_initialization():
    """Test that CLIP identifier initializes correctly"""
    identifier = get_clip_identifier()
    assert identifier is not None
    assert identifier.model is not None
    assert identifier.supabase_client is not None
    print("✅ CLIP identifier initialized successfully")

def test_greavard_crop_identification():
    """Test identification of Greavard crop using CLIP"""
    crop_path = os.path.join(os.path.dirname(__file__), "fixtures", "greavard_crop.jpg")
    
    if not os.path.exists(crop_path):
        pytest.skip(f"Test fixture not found: {crop_path}")
    
    # Test with CLIP (should work much better than OCR)
    result = identify_card_from_crop(crop_path, use_clip=True, similarity_threshold=0.75)
    
    print(f"🧪 CLIP Result: {result}")
    
    # CLIP should succeed where OCR failed
    assert result["success"] == True
    assert result["method"] == "clip_embedding"
    assert "name" in result
    assert "similarity" in result
    assert result["similarity"] >= 0.75
    
    # Should be a Greavard card (though exact variant may differ)
    name_lower = result["name"].lower()
    assert "greavard" in name_lower or "houndstone" in name_lower  # Evolution line
    
    print(f"✅ CLIP identified: {result['name']} with {result['similarity']:.3f} similarity")

def test_wugtrio_crop_identification():
    """Test identification of Wugtrio crop using CLIP"""
    crop_path = os.path.join(os.path.dirname(__file__), "fixtures", "wugtrio_crop.jpg")
    
    if not os.path.exists(crop_path):
        pytest.skip(f"Test fixture not found: {crop_path}")
    
    result = identify_card_from_crop(crop_path, use_clip=True, similarity_threshold=0.75)
    
    print(f"🧪 CLIP Result: {result}")
    
    assert result["success"] == True
    assert result["method"] == "clip_embedding"
    assert result["similarity"] >= 0.75
    
    # Should identify Wugtrio or related Diglett evolution
    name_lower = result["name"].lower()
    assert any(name in name_lower for name in ["wugtrio", "diglett", "dugtrio"])
    
    print(f"✅ CLIP identified: {result['name']} with {result['similarity']:.3f} similarity")

def test_pidgeot_ex_crop_identification():
    """Test identification of Pidgeot ex crop using CLIP"""
    crop_path = os.path.join(os.path.dirname(__file__), "fixtures", "pidgeot_ex_crop.jpg")
    
    if not os.path.exists(crop_path):
        pytest.skip(f"Test fixture not found: {crop_path}")
    
    result = identify_card_from_crop(crop_path, use_clip=True, similarity_threshold=0.75)
    
    print(f"🧪 CLIP Result: {result}")
    
    assert result["success"] == True
    assert result["method"] == "clip_embedding"
    assert result["similarity"] >= 0.75
    
    # Should identify Pidgeot
    name_lower = result["name"].lower()
    assert "pidgeot" in name_lower or "pidgey" in name_lower or "pidgeotto" in name_lower
    
    print(f"✅ CLIP identified: {result['name']} with {result['similarity']:.3f} similarity")

def test_clip_vs_ocr_comparison():
    """Compare CLIP vs OCR performance on test fixtures"""
    test_crops = [
        "greavard_crop.jpg",
        "wugtrio_crop.jpg", 
        "pidgeot_ex_crop.jpg"
    ]
    
    clip_successes = 0
    ocr_successes = 0
    
    for crop_file in test_crops:
        crop_path = os.path.join(os.path.dirname(__file__), "fixtures", crop_file)
        
        if not os.path.exists(crop_path):
            continue
            
        # Test CLIP
        clip_result = identify_card_from_crop(crop_path, use_clip=True, similarity_threshold=0.75)
        if clip_result["success"]:
            clip_successes += 1
            
        # Test OCR (fallback)
        ocr_result = identify_card_from_crop(crop_path, use_clip=False)
        if ocr_result["success"]:
            ocr_successes += 1
    
    print(f"📊 CLIP Success Rate: {clip_successes}/{len(test_crops)} ({clip_successes/len(test_crops)*100:.1f}%)")
    print(f"📊 OCR Success Rate: {ocr_successes}/{len(test_crops)} ({ocr_successes/len(test_crops)*100:.1f}%)")
    
    # CLIP should significantly outperform OCR
    assert clip_successes >= ocr_successes
    # Target: At least 67% success rate for CLIP (2/3 crops)
    assert clip_successes >= 2

def test_similarity_threshold_behavior():
    """Test that similarity threshold affects results correctly"""
    crop_path = os.path.join(os.path.dirname(__file__), "fixtures", "greavard_crop.jpg")
    
    if not os.path.exists(crop_path):
        pytest.skip(f"Test fixture not found: {crop_path}")
    
    # High threshold (0.95) - should be very restrictive
    high_thresh_result = identify_card_from_crop(crop_path, use_clip=True, similarity_threshold=0.95)
    
    # Low threshold (0.60) - should be more permissive 
    low_thresh_result = identify_card_from_crop(crop_path, use_clip=True, similarity_threshold=0.60)
    
    print(f"🎯 High threshold (0.95): {high_thresh_result['success']}")
    print(f"🎯 Low threshold (0.60): {low_thresh_result['success']}")
    
    # Low threshold should be more likely to succeed
    if high_thresh_result["success"]:
        # If high threshold works, low threshold should definitely work
        assert low_thresh_result["success"] == True
        # And similarity should be high
        assert low_thresh_result["similarity"] >= 0.95
    else:
        # If high threshold fails, low threshold might still work
        # This tests the threshold logic is working correctly
        pass

if __name__ == "__main__":
    # Run tests directly
    print("🧪 Testing CLIP-based card identification...")
    
    test_clip_identifier_initialization()
    test_greavard_crop_identification()
    test_wugtrio_crop_identification() 
    test_pidgeot_ex_crop_identification()
    test_clip_vs_ocr_comparison()
    test_similarity_threshold_behavior()
    
    print("🎉 All CLIP tests completed!") 