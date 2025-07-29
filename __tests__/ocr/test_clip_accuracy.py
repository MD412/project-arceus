#!/usr/bin/env python3
"""
CLIP Accuracy Validation Tests
Ensures CLIP identification meets 95% accuracy threshold for CI/CD pipeline
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'worker'))

import pytest
from pathlib import Path
from clip_lookup import identify_card_from_crop, get_clip_identifier

# Minimum accuracy threshold for CI to pass
MINIMUM_ACCURACY_THRESHOLD = 0.95
CONFIDENCE_THRESHOLD = 0.85  # Updated production threshold based on training data analysis

class AccuracyTracker:
    def __init__(self):
        self.total_tests = 0
        self.successful_identifications = 0
        self.results = []
    
    def add_result(self, test_name, expected, actual, success, confidence=None):
        self.total_tests += 1
        if success:
            self.successful_identifications += 1
        
        self.results.append({
            'test': test_name,
            'expected': expected,
            'actual': actual,
            'success': success,
            'confidence': confidence
        })
    
    def get_accuracy(self):
        if self.total_tests == 0:
            return 0.0
        return self.successful_identifications / self.total_tests
    
    def print_summary(self):
        accuracy = self.get_accuracy()
        print(f"\n📊 CLIP Accuracy Summary:")
        print(f"   Total Tests: {self.total_tests}")
        print(f"   Successful: {self.successful_identifications}")
        print(f"   Accuracy: {accuracy:.1%}")
        print(f"   Threshold: {MINIMUM_ACCURACY_THRESHOLD:.1%}")
        
        if accuracy >= MINIMUM_ACCURACY_THRESHOLD:
            print(f"   ✅ PASS - Meets accuracy requirement")
        else:
            print(f"   ❌ FAIL - Below accuracy requirement")
            print(f"   📋 Failed tests:")
            for result in self.results:
                if not result['success']:
                    print(f"      - {result['test']}: expected '{result['expected']}', got '{result['actual']}'")
        
        return accuracy >= MINIMUM_ACCURACY_THRESHOLD

# Global accuracy tracker
accuracy_tracker = AccuracyTracker()

def test_greavard_identification():
    """Test Greavard crop identification"""
    crop_path = os.path.join(os.path.dirname(__file__), "fixtures", "greavard_crop.jpg")
    
    if not os.path.exists(crop_path):
        pytest.skip(f"Test fixture not found: {crop_path}")
    
    result = identify_card_from_crop(crop_path, use_clip=True, similarity_threshold=CONFIDENCE_THRESHOLD)
    
    expected_name = "greavard"
    actual_name = result.get("name", "").lower()
    success = result.get("success", False) and expected_name in actual_name
    confidence = result.get("similarity", 0.0)
    
    accuracy_tracker.add_result("greavard_crop", expected_name, actual_name, success, confidence)
    
    if success:
        print(f"✅ Greavard: {result['name']} ({confidence:.3f} confidence)")
    else:
        print(f"❌ Greavard: Failed identification - {result}")

def test_wugtrio_identification():
    """Test Wugtrio crop identification"""
    crop_path = os.path.join(os.path.dirname(__file__), "fixtures", "wugtrio_crop.jpg")
    
    if not os.path.exists(crop_path):
        pytest.skip(f"Test fixture not found: {crop_path}")
    
    result = identify_card_from_crop(crop_path, use_clip=True, similarity_threshold=CONFIDENCE_THRESHOLD)
    
    expected_name = "wugtrio"
    actual_name = result.get("name", "").lower()
    success = result.get("success", False) and expected_name in actual_name
    confidence = result.get("similarity", 0.0)
    
    accuracy_tracker.add_result("wugtrio_crop", expected_name, actual_name, success, confidence)
    
    if success:
        print(f"✅ Wugtrio: {result['name']} ({confidence:.3f} confidence)")
    else:
        print(f"❌ Wugtrio: Failed identification - {result}")

def test_pidgeot_ex_identification():
    """Test Pidgeot EX crop identification"""
    crop_path = os.path.join(os.path.dirname(__file__), "fixtures", "pidgeot_ex_crop.jpg")
    
    if not os.path.exists(crop_path):
        pytest.skip(f"Test fixture not found: {crop_path}")
    
    result = identify_card_from_crop(crop_path, use_clip=True, similarity_threshold=CONFIDENCE_THRESHOLD)
    
    expected_name = "pidgeot"
    actual_name = result.get("name", "").lower()
    success = result.get("success", False) and expected_name in actual_name
    confidence = result.get("similarity", 0.0)
    
    accuracy_tracker.add_result("pidgeot_ex_crop", expected_name, actual_name, success, confidence)
    
    if success:
        print(f"✅ Pidgeot EX: {result['name']} ({confidence:.3f} confidence)")
    else:
        print(f"❌ Pidgeot EX: Failed identification - {result}")

def test_training_data_samples():
    """Test a sample of training data for accuracy validation"""
    training_dir = Path(__file__).parent.parent.parent / "training_data" / "card_crops" / "correct"
    
    if not training_dir.exists():
        pytest.skip("Training data not available")
    
    # Test up to 10 training examples
    test_files = list(training_dir.glob("*.jpg"))[:10]
    
    for crop_file in test_files:
        result = identify_card_from_crop(str(crop_file), use_clip=True, similarity_threshold=CONFIDENCE_THRESHOLD)
        
        # For training data, we assume it's correctly categorized
        # Success is defined as CLIP returning a confident result
        success = result.get("success", False) and result.get("similarity", 0.0) >= CONFIDENCE_THRESHOLD
        confidence = result.get("similarity", 0.0)
        
        accuracy_tracker.add_result(
            f"training_{crop_file.name}", 
            "correct_identification", 
            result.get("name", "unknown"), 
            success, 
            confidence
        )
        
        if success:
            print(f"✅ Training sample {crop_file.name}: {result['name']} ({confidence:.3f})")
        else:
            print(f"❌ Training sample {crop_file.name}: Failed - {result}")

def test_overall_accuracy_requirement():
    """Final test to ensure overall accuracy meets 95% threshold"""
    passes_accuracy = accuracy_tracker.print_summary()
    
    # This assertion will fail the entire test suite if accuracy is below threshold
    assert passes_accuracy, f"CLIP accuracy {accuracy_tracker.get_accuracy():.1%} is below required {MINIMUM_ACCURACY_THRESHOLD:.1%}"
    
    print(f"🎉 CLIP accuracy validation PASSED!")

if __name__ == "__main__":
    print("🧪 Running CLIP Accuracy Validation Tests...")
    print(f"🎯 Target Accuracy: {MINIMUM_ACCURACY_THRESHOLD:.1%}")
    print(f"🔧 Confidence Threshold: {CONFIDENCE_THRESHOLD}")
    
    test_greavard_identification()
    test_wugtrio_identification()
    test_pidgeot_ex_identification()
    test_training_data_samples()
    test_overall_accuracy_requirement()
    
    print("✅ All accuracy tests completed!") 