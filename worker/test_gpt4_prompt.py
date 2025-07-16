#!/usr/bin/env python3
"""
GPT-4o Mini Prompt Testing Script
Tests prompt engineering and accuracy on real card crop images
"""
import os
import glob
import json
from typing import List, Dict
from gpt4_vision_identifier import GPT4VisionIdentifier
import time

def find_test_crops(max_crops: int = 10) -> List[str]:
    """Find recent crop images for testing"""
    crop_pattern = "output/*.jpg"
    crop_files = glob.glob(crop_pattern)
    
    # Sort by modification time (newest first)
    crop_files.sort(key=os.path.getmtime, reverse=True)
    
    return crop_files[:max_crops]

def run_prompt_tests():
    """Run GPT-4o Mini tests on crop images"""
    print("🧪 GPT-4o Mini Prompt Testing")
    print("=" * 50)
    
    # Initialize identifier
    identifier = GPT4VisionIdentifier(daily_budget_usd=0.05)  # Low budget for testing
    
    # Get test images
    test_crops = find_test_crops(max_crops=5)  # Start small
    
    if not test_crops:
        print("❌ No crop images found in output/ directory")
        print("💡 Run the worker first to generate test crops")
        return
    
    print(f"📸 Testing {len(test_crops)} crop images...")
    print()
    
    results = []
    total_cost = 0.0
    total_time = 0
    
    for i, crop_path in enumerate(test_crops, 1):
        print(f"🔍 Test {i}/{len(test_crops)}: {os.path.basename(crop_path)}")
        
        start_time = time.time()
        result = identifier.identify_card(crop_path)
        test_time = time.time() - start_time
        
        total_cost += result.get('cost_usd', 0.0)
        total_time += test_time
        
        if result['success']:
            card = result['card']
            print(f"   ✅ Success: {card['name']} | {card['set_code']}-{card['number']} | Confidence: {card['confidence']:.2f}")
            print(f"   💰 Cost: ${result['cost_usd']:.4f} | ⏱️  {result['response_time_ms']}ms")
        else:
            print(f"   ❌ Failed: {result.get('error', 'Unknown error')}")
            print(f"   💰 Cost: ${result['cost_usd']:.4f}")
        
        # Store result for analysis
        results.append({
            'crop_file': os.path.basename(crop_path),
            'result': result,
            'test_time': test_time
        })
        
        print()
        
        # Small delay to be nice to API
        time.sleep(1)
    
    # Summary
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    successful_tests = [r for r in results if r['result']['success']]
    success_rate = len(successful_tests) / len(results) * 100
    
    print(f"✅ Success Rate: {success_rate:.1f}% ({len(successful_tests)}/{len(results)})")
    print(f"💰 Total Cost: ${total_cost:.4f}")
    print(f"⏱️  Average Response Time: {(total_time / len(results)):.1f}s")
    
    if successful_tests:
        avg_confidence = sum(r['result']['card']['confidence'] for r in successful_tests) / len(successful_tests)
        print(f"🎯 Average Confidence: {avg_confidence:.2f}")
    
    # Cost analysis
    cost_summary = identifier.get_daily_cost_summary()
    print(f"📈 Daily Budget Used: {cost_summary['budget_used_pct']:.1f}%")
    
    # Save detailed results
    results_file = f"gpt4_test_results_{time.strftime('%Y%m%d_%H%M%S')}.json"
    with open(results_file, 'w') as f:
        json.dump({
            'summary': {
                'success_rate': success_rate,
                'total_cost': total_cost,
                'avg_response_time': total_time / len(results),
                'avg_confidence': avg_confidence if successful_tests else 0.0
            },
            'results': results,
            'cost_summary': cost_summary
        }, f, indent=2)
    
    print(f"💾 Detailed results saved to: {results_file}")
    
    # Analysis and recommendations
    print("\n🔍 ANALYSIS")
    print("=" * 50)
    
    if success_rate >= 95:
        print("🎉 EXCELLENT: Prompt is production-ready!")
    elif success_rate >= 80:
        print("✅ GOOD: Prompt works well, minor tweaks possible")
    elif success_rate >= 60:
        print("⚠️  NEEDS WORK: Prompt requires significant improvement")
    else:
        print("❌ POOR: Prompt needs complete redesign")
    
    if total_cost > 0.02:  # $0.02 for 5 test images
        print("💸 Cost concern: Consider reducing image detail or prompt length")
    
    if any(r['result']['response_time_ms'] > 5000 for r in results):
        print("🐌 Latency concern: Some requests took >5 seconds")
    
    print("\n🚀 Ready for Phase 2 integration testing!")

if __name__ == "__main__":
    run_prompt_tests() 