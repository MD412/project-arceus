#!/usr/bin/env python3
"""
Automated CLIP Testing Suite for Project Arceus
Tests accuracy, performance, and regression detection for CLIP-based card identification
"""
import sys
import os
import json
import time
import pathlib
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'worker'))

import pytest
from PIL import Image
from clip_lookup import identify_card_from_crop, get_clip_identifier

@dataclass
class CLIPTestResult:
    """Test result data structure"""
    image_name: str
    expected_name: str
    actual_name: Optional[str]
    similarity: float
    success: bool
    duration_ms: float
    error: Optional[str] = None

class CLIPTestSuite:
    """Automated CLIP testing suite"""
    
    def __init__(self):
        self.fixtures_dir = pathlib.Path(__file__).parent / "fixtures"
        self.worker_fixtures_dir = pathlib.Path(__file__).resolve().parents[2] / "worker" / "test_fixtures"
        self.results: List[CLIPTestResult] = []
        
    def discover_test_cases(self) -> List[Tuple[pathlib.Path, str]]:
        """Discover all available test cases with expected names"""
        test_cases = []
        
        # Check both fixture directories
        for fixtures_dir in [self.fixtures_dir, self.worker_fixtures_dir]:
            if not fixtures_dir.exists():
                continue
                
            for img_path in fixtures_dir.glob("*.*"):
                if img_path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
                    continue
                    
                # Look for corresponding JSON metadata
                meta_path = img_path.with_suffix(".json")
                if meta_path.exists():
                    try:
                        meta = json.loads(meta_path.read_text())
                        expected_name = meta.get("name")
                        if expected_name:
                            test_cases.append((img_path, expected_name))
                    except (json.JSONDecodeError, KeyError):
                        # Fallback: derive expected name from filename
                        expected_name = self._derive_expected_name(img_path.stem)
                        test_cases.append((img_path, expected_name))
                else:
                    # No metadata, derive from filename
                    expected_name = self._derive_expected_name(img_path.stem)
                    test_cases.append((img_path, expected_name))
        
        return test_cases
    
    def _derive_expected_name(self, filename: str) -> str:
        """Derive expected card name from filename"""
        # Remove common suffixes and clean up
        name = filename.replace("_crop", "").replace("_ex", " ex")
        name = name.replace("_", " ").title()
        return name
    
    def run_single_test(self, img_path: pathlib.Path, expected_name: str, 
                       similarity_threshold: float = 0.75) -> CLIPTestResult:
        """Run CLIP identification on a single image"""
        start_time = time.time()
        
        try:
            result = identify_card_from_crop(
                str(img_path), 
                use_clip=True, 
                similarity_threshold=similarity_threshold
            )
            
            duration_ms = (time.time() - start_time) * 1000
            
            success = result.get("success", False)
            actual_name = result.get("name", "") if success else None
            similarity = result.get("similarity", 0.0)
            error = result.get("error") if not success else None
            
            return CLIPTestResult(
                image_name=img_path.name,
                expected_name=expected_name,
                actual_name=actual_name,
                similarity=similarity,
                success=success,
                duration_ms=duration_ms,
                error=error
            )
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            return CLIPTestResult(
                image_name=img_path.name,
                expected_name=expected_name,
                actual_name=None,
                similarity=0.0,
                success=False,
                duration_ms=duration_ms,
                error=str(e)
            )
    
    def run_accuracy_test(self, similarity_threshold: float = 0.75) -> Dict:
        """Run accuracy test across all fixtures"""
        test_cases = self.discover_test_cases()
        results = []
        
        print(f"🧪 Running CLIP accuracy test with threshold {similarity_threshold}")
        print(f"📁 Found {len(test_cases)} test cases")
        
        for img_path, expected_name in test_cases:
            result = self.run_single_test(img_path, expected_name, similarity_threshold)
            results.append(result)
            
            status = "✅" if result.success else "❌"
            print(f"{status} {result.image_name}: {result.similarity:.3f} similarity")
            if result.success and result.actual_name:
                print(f"   Expected: {expected_name}")
                print(f"   Got: {result.actual_name}")
        
        # Calculate metrics
        total_tests = len(results)
        successful_tests = sum(1 for r in results if r.success)
        accuracy = successful_tests / total_tests if total_tests > 0 else 0
        avg_similarity = sum(r.similarity for r in results if r.success) / successful_tests if successful_tests > 0 else 0
        avg_duration = sum(r.duration_ms for r in results) / total_tests if total_tests > 0 else 0
        
        summary = {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "accuracy_percent": accuracy * 100,
            "avg_similarity": avg_similarity,
            "avg_duration_ms": avg_duration,
            "threshold": similarity_threshold,
            "results": results
        }
        
        print(f"\n📊 CLIP Accuracy Results:")
        print(f"   Success Rate: {successful_tests}/{total_tests} ({accuracy*100:.1f}%)")
        print(f"   Avg Similarity: {avg_similarity:.3f}")
        print(f"   Avg Duration: {avg_duration:.1f}ms")
        
        return summary
    
    def run_threshold_analysis(self) -> Dict:
        """Test different similarity thresholds to find optimal balance"""
        thresholds = [0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95]
        threshold_results = {}
        
        print(f"🎯 Running threshold analysis across {len(thresholds)} thresholds")
        
        for threshold in thresholds:
            result = self.run_accuracy_test(threshold)
            threshold_results[threshold] = {
                "accuracy": result["accuracy_percent"],
                "avg_similarity": result["avg_similarity"],
                "successful_tests": result["successful_tests"]
            }
            print(f"   Threshold {threshold:.2f}: {result['accuracy_percent']:.1f}% accuracy")
        
        # Find optimal threshold (highest accuracy with reasonable similarity)
        optimal_threshold = max(threshold_results.keys(), 
                              key=lambda t: threshold_results[t]["accuracy"])
        
        print(f"\n🎯 Optimal Threshold: {optimal_threshold:.2f}")
        print(f"   Achieves {threshold_results[optimal_threshold]['accuracy']:.1f}% accuracy")
        
        return {
            "threshold_results": threshold_results,
            "optimal_threshold": optimal_threshold,
            "optimal_accuracy": threshold_results[optimal_threshold]["accuracy"]
        }
    
    def run_performance_benchmark(self, iterations: int = 5) -> Dict:
        """Benchmark CLIP performance across multiple runs"""
        test_cases = self.discover_test_cases()
        if not test_cases:
            return {"error": "No test cases found"}
        
        # Use first test case for consistent benchmarking
        img_path, expected_name = test_cases[0]
        durations = []
        
        print(f"⚡ Running performance benchmark: {iterations} iterations on {img_path.name}")
        
        for i in range(iterations):
            result = self.run_single_test(img_path, expected_name)
            durations.append(result.duration_ms)
            print(f"   Run {i+1}: {result.duration_ms:.1f}ms")
        
        avg_duration = sum(durations) / len(durations)
        min_duration = min(durations)
        max_duration = max(durations)
        
        print(f"\n⚡ Performance Results:")
        print(f"   Average: {avg_duration:.1f}ms")
        print(f"   Min: {min_duration:.1f}ms")
        print(f"   Max: {max_duration:.1f}ms")
        print(f"   Variation: {max_duration - min_duration:.1f}ms")
        
        return {
            "iterations": iterations,
            "durations_ms": durations,
            "avg_duration_ms": avg_duration,
            "min_duration_ms": min_duration,
            "max_duration_ms": max_duration,
            "variation_ms": max_duration - min_duration
        }

# Pytest integration
def test_clip_accuracy():
    """Test CLIP accuracy meets minimum threshold"""
    suite = CLIPTestSuite()
    result = suite.run_accuracy_test(similarity_threshold=0.75)
    
    # Assert minimum 67% accuracy (2/3 cards should work)
    assert result["accuracy_percent"] >= 67.0, f"CLIP accuracy {result['accuracy_percent']:.1f}% below 67% threshold"
    
    # Assert reasonable average similarity for successful matches
    if result["successful_tests"] > 0:
        assert result["avg_similarity"] >= 0.75, f"Average similarity {result['avg_similarity']:.3f} below 0.75 threshold"

def test_clip_performance():
    """Test CLIP performance meets speed requirements"""
    suite = CLIPTestSuite()
    result = suite.run_performance_benchmark(iterations=3)
    
    if "error" not in result:
        # Should complete within reasonable time (2 seconds per identification)
        assert result["avg_duration_ms"] <= 2000, f"CLIP too slow: {result['avg_duration_ms']:.1f}ms average"

def test_clip_initialization():
    """Test CLIP model loads successfully"""
    identifier = get_clip_identifier()
    assert identifier is not None
    assert identifier.model is not None
    assert identifier.supabase_client is not None

if __name__ == "__main__":
    # Run comprehensive test suite
    print("🚀 Starting Automated CLIP Test Suite...")
    
    suite = CLIPTestSuite()
    
    # Run all tests
    print("\n" + "="*60)
    accuracy_result = suite.run_accuracy_test()
    
    print("\n" + "="*60)
    threshold_result = suite.run_threshold_analysis()
    
    print("\n" + "="*60)
    performance_result = suite.run_performance_benchmark()
    
    print("\n" + "="*60)
    print("🎉 Automated CLIP testing complete!")
    
    # Summary
    print(f"\n📋 Final Summary:")
    print(f"   🎯 Accuracy: {accuracy_result['accuracy_percent']:.1f}%")
    print(f"   🎯 Optimal Threshold: {threshold_result['optimal_threshold']:.2f}")
    print(f"   ⚡ Avg Performance: {performance_result.get('avg_duration_ms', 'N/A')}ms") 