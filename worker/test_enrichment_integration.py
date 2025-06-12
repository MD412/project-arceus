#!/usr/bin/env python3
"""
Test script to verify card enrichment integration with production worker
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent / 'workers'))

from supabase_adapter import SupabaseCardEnricher, DetectionInput

def test_enrichment_integration():
    """Test the card enrichment system"""
    print("🧪 Testing Card Enrichment Integration...")
    
    try:
        # Initialize enricher
        enricher = SupabaseCardEnricher()
        print("✅ Card enricher initialized")
        
        # Test cases simulating what the production worker will send
        test_detections = [
            {
                'name': 'Charizard',
                'confidence': 0.85,
                'expected_match': 'Charizard ex'
            },
            {
                'name': 'Pikachu', 
                'confidence': 0.92,
                'expected_match': 'Pikachu VMAX'
            },
            {
                'name': 'Mewtwo',
                'confidence': 0.78,
                'expected_match': 'Mewtwo GX'
            }
        ]
        
        successful_matches = 0
        
        for i, test_case in enumerate(test_detections):
            print(f"\n🔍 Test {i+1}: {test_case['name']}")
            
            # Create detection input (simulating production worker)
            detection_input = DetectionInput(
                detection_id=f"test_card_{i}",
                job_id="test_job_123",
                predicted_name=test_case['name'],
                confidence=test_case['confidence'],
                bounding_box={'x': 100, 'y': 100, 'width': 200, 'height': 300},
                cropped_image_path=f"/tmp/card_{i}.jpg",
                tile_source=f"tile_{i}"
            )
            
            # Run enrichment
            result = enricher.enrich_detection(detection_input)
            
            if result.success and result.best_match:
                print(f"  ✅ Found: {result.best_match.card_name}")
                print(f"     Set: {result.best_match.set_name} ({result.best_match.set_code})")
                print(f"     Confidence: {result.identification_confidence:.1f}%")
                print(f"     Method: {result.identification_method}")
                print(f"     Processing: {result.processing_time_ms:.1f}ms")
                successful_matches += 1
                
                # Check if it matches expected
                if test_case['expected_match'] in result.best_match.card_name:
                    print("     ✅ Expected match found!")
                else:
                    print(f"     ⚠️  Expected {test_case['expected_match']}, got {result.best_match.card_name}")
            else:
                print(f"  ❌ No match: {result.error_message}")
        
        print(f"\n📊 Results: {successful_matches}/{len(test_detections)} cards successfully enriched")
        
        if successful_matches >= len(test_detections) * 0.8:  # 80% success rate
            print("🎉 Integration test PASSED - Ready for live uploads!")
            return True
        else:
            print("❌ Integration test FAILED - Need debugging")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

if __name__ == "__main__":
    success = test_enrichment_integration()
    if success:
        print("\n🚀 Your upload pipeline is ready!")
        print("   Upload a photo → Cards detected → Real names identified!")
    else:
        print("\n🔧 Need to fix issues before going live") 