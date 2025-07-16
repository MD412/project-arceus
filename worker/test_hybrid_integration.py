#!/usr/bin/env python3
"""
Hybrid Integration Test - Phase 2
Tests CLIP → GPT routing and cost optimization
"""
import os
import glob
import json
import time
from unittest.mock import patch, Mock
from hybrid_card_identifier_v2 import HybridCardIdentifierV2

def create_mock_clip_result(similarity: float, card_found: bool = True):
    """Create mock CLIP result with specified similarity"""
    if card_found:
        return {
            'card_id': 'mock-card-123',
            'name': 'Mock Pokemon',
            'set_code': 'mock1', 
            'number': '001',
            'similarity': similarity
        }
    else:
        return {'similarity': 0.0}

def create_mock_gpt_result(confidence: float, success: bool = True):
    """Create mock GPT result with specified confidence"""
    if success:
        return {
            'success': True,
            'card': {
                'name': 'GPT Pokemon',
                'set_code': 'gpt1',
                'number': '002',
                'confidence': confidence
            },
            'cost_usd': 0.002,
            'response_time_ms': 1500
        }
    else:
        return {
            'success': False,
            'error': 'GPT API error',
            'cost_usd': 0.002
        }

def test_routing_scenarios():
    """Test all routing scenarios in the hybrid system"""
    print("🧪 Hybrid Integration Testing - Phase 2")
    print("=" * 60)
    
    # Test scenarios
    scenarios = [
        {
            'name': 'High CLIP Confidence → Skip GPT',
            'clip_similarity': 0.85,
            'expected_method': 'clip',
            'expected_gpt_calls': 0
        },
        {
            'name': 'Medium CLIP Confidence → Call GPT → High GPT Confidence',
            'clip_similarity': 0.65,
            'gpt_confidence': 0.90,
            'expected_method': 'gpt',
            'expected_gpt_calls': 1
        },
        {
            'name': 'Low CLIP Confidence → Call GPT → Low GPT Confidence',
            'clip_similarity': 0.45,
            'gpt_confidence': 0.60,
            'expected_method': 'uncertain',
            'expected_gpt_calls': 1
        },
        {
            'name': 'CLIP Fails → GPT Succeeds → Cache',
            'clip_similarity': 0.0,
            'clip_found': False,
            'gpt_confidence': 0.95,
            'expected_method': 'gpt',
            'expected_gpt_calls': 1
        },
        {
            'name': 'Both CLIP and GPT Fail',
            'clip_similarity': 0.0,
            'clip_found': False,
            'gpt_success': False,
            'expected_method': 'failed',
            'expected_gpt_calls': 1
        }
    ]
    
    total_cost = 0.0
    gpt_call_count = 0
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n🔍 Scenario {i}: {scenario['name']}")
        print("-" * 50)
        
        # Setup mocks
        with patch('hybrid_card_identifier_v2.CLIPCardIdentifier') as mock_clip_class, \
             patch('hybrid_card_identifier_v2.GPT4VisionIdentifier') as mock_gpt_class, \
             patch('hybrid_card_identifier_v2.PokemonTCGAPI') as mock_tcg_class:
            
            # Mock CLIP identifier
            mock_clip = Mock()
            mock_clip_class.return_value = mock_clip
            mock_clip.identify_card_from_crop.return_value = create_mock_clip_result(
                scenario['clip_similarity'], 
                scenario.get('clip_found', True)
            )
            
            # Mock GPT identifier  
            mock_gpt = Mock()
            mock_gpt_class.return_value = mock_gpt
            mock_gpt.identify_card.return_value = create_mock_gpt_result(
                scenario.get('gpt_confidence', 0.0),
                scenario.get('gpt_success', True)
            )
            
            # Mock TCG API
            mock_tcg = Mock()
            mock_tcg_class.return_value = mock_tcg
            
            # Create hybrid identifier
            identifier = HybridCardIdentifierV2(api_key="mock_key", gpt_daily_budget=0.10)
            
            # Remove async for testing
            identifier._cache_gpt_result = lambda *args, **kwargs: {"card_id": "cached-123"}
            
            # Test identification
            result = identifier.identify_card("fake_image.jpg")
            
            # Verify results
            print(f"   Method: {result['method']}")
            print(f"   Success: {result['success']}")
            print(f"   Cost: ${result.get('cost_usd', 0.0):.4f}")
            
            # Check expected method
            if result['method'] == scenario['expected_method']:
                print(f"   ✅ Routing correct: {result['method']}")
            else:
                print(f"   ❌ Routing wrong: expected {scenario['expected_method']}, got {result['method']}")
            
            # Count GPT calls
            actual_gpt_calls = mock_gpt.identify_card.call_count
            expected_gpt_calls = scenario['expected_gpt_calls']
            
            if actual_gpt_calls == expected_gpt_calls:
                print(f"   ✅ GPT calls correct: {actual_gpt_calls}")
            else:
                print(f"   ❌ GPT calls wrong: expected {expected_gpt_calls}, got {actual_gpt_calls}")
            
            gpt_call_count += actual_gpt_calls
            total_cost += result.get('cost_usd', 0.0)
    
    # Summary
    print(f"\n📊 INTEGRATION TEST SUMMARY")
    print("=" * 60)
    print(f"Total Scenarios: {len(scenarios)}")
    print(f"Total GPT Calls: {gpt_call_count}")
    print(f"Total Cost: ${total_cost:.4f}")
    print(f"Cost Efficiency: {((len(scenarios) - gpt_call_count) / len(scenarios)) * 100:.1f}% avoided GPT calls")
    
    # Expected results
    print(f"\n🎯 Expected Performance:")
    print(f"   • High CLIP confidence: Skip GPT (save $0.002)")
    print(f"   • Medium/Low confidence: Use GPT fallback") 
    print(f"   • Failed GPT: Graceful degradation to CLIP")
    print(f"   • New cards: Auto-cache for future CLIP success")
    
    print(f"\n🚀 Ready for Phase 3: End-to-end testing!")

if __name__ == "__main__":
    test_routing_scenarios() 