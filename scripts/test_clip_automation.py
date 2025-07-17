#!/usr/bin/env python3
"""
CI/CD CLIP Testing Script for Project Arceus
Runs automated CLIP tests and outputs results in machine-readable format
"""
import sys
import os
import json
import argparse
from pathlib import Path

# Add worker and test paths
worker_path = os.path.join(os.path.dirname(__file__), '..', 'worker')
test_path = os.path.join(os.path.dirname(__file__), '..', '__tests__', 'ocr')
sys.path.insert(0, worker_path)
sys.path.insert(0, test_path)

try:
    from test_clip_automation import CLIPTestSuite
except ImportError as e:
    print(f"❌ Error: Could not import CLIPTestSuite: {e}")
    print(f"Checked paths: {worker_path}, {test_path}")
    print("Ensure test_clip_automation.py exists in __tests__/ocr/")
    sys.exit(1)

def run_ci_tests(accuracy_threshold: float = 67.0, 
                performance_threshold: float = 2000.0,
                output_file: str = None) -> bool:
    """
    Run CLIP tests suitable for CI/CD environments
    
    Args:
        accuracy_threshold: Minimum accuracy percentage required (default 67%)
        performance_threshold: Maximum average duration in ms (default 2000ms)
        output_file: Optional JSON file to write results
    
    Returns:
        bool: True if all tests pass, False otherwise
    """
    
    print("Running CI/CD CLIP Test Suite...")
    suite = CLIPTestSuite()
    all_passed = True
    results = {}
    
    try:
        # Test 1: Accuracy Test
        print("\nRunning accuracy test...")
        accuracy_result = suite.run_accuracy_test(similarity_threshold=0.75)
        results["accuracy_test"] = accuracy_result
        
        accuracy_passed = accuracy_result["accuracy_percent"] >= accuracy_threshold
        print(f"   Result: {accuracy_result['accuracy_percent']:.1f}% ({'PASS' if accuracy_passed else 'FAIL'})")
        
        if not accuracy_passed:
            all_passed = False
            print(f"   Error: Accuracy {accuracy_result['accuracy_percent']:.1f}% below threshold {accuracy_threshold}%")
        
        # Test 2: Performance Test  
        print("\nRunning performance test...")
        performance_result = suite.run_performance_benchmark(iterations=3)
        results["performance_test"] = performance_result
        
        if "error" not in performance_result:
            avg_duration = performance_result["avg_duration_ms"]
            performance_passed = avg_duration <= performance_threshold
            print(f"   Result: {avg_duration:.1f}ms average ({'PASS' if performance_passed else 'FAIL'})")
            
            if not performance_passed:
                all_passed = False
                print(f"   Error: Performance {avg_duration:.1f}ms above threshold {performance_threshold}ms")
        else:
            all_passed = False
            print(f"   FAIL: {performance_result['error']}")
        
        # Test 3: Initialization Test
        print("\nTesting CLIP initialization...")
        try:
            from clip_lookup import get_clip_identifier
            identifier = get_clip_identifier()
            init_passed = (identifier is not None and 
                          identifier.model is not None and 
                          identifier.supabase_client is not None)
            print(f"   Result: {'PASS' if init_passed else 'FAIL'}")
            results["initialization_test"] = {"passed": init_passed}
            
            if not init_passed:
                all_passed = False
                print("   Error: CLIP identifier failed to initialize properly")
                
        except Exception as e:
            all_passed = False
            print(f"   FAIL: {str(e)}")
            results["initialization_test"] = {"passed": False, "error": str(e)}
        
        # Overall Results
        results["overall"] = {
            "all_tests_passed": all_passed,
            "accuracy_threshold": accuracy_threshold,
            "performance_threshold": performance_threshold,
            "timestamp": accuracy_result.get("timestamp", "unknown")
        }
        
        print(f"\nOverall Result: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
        
        # Write JSON output if requested
        if output_file:
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            print(f"Results written to: {output_file}")
        
        return all_passed
        
    except Exception as e:
        print(f"Fatal error during testing: {str(e)}")
        results["fatal_error"] = str(e)
        results["overall"] = {"all_tests_passed": False}
        
        if output_file:
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2, default=str)
        
        return False

def main():
    parser = argparse.ArgumentParser(description="Automated CLIP testing for CI/CD")
    parser.add_argument("--accuracy-threshold", type=float, default=67.0,
                       help="Minimum accuracy percentage required (default: 67.0)")
    parser.add_argument("--performance-threshold", type=float, default=2000.0,
                       help="Maximum average duration in milliseconds (default: 2000.0)")
    parser.add_argument("--output", type=str, 
                       help="JSON file to write test results")
    parser.add_argument("--quiet", action="store_true",
                       help="Suppress verbose output")
    
    args = parser.parse_args()
    
    # Suppress prints if quiet mode
    if args.quiet:
        sys.stdout = open(os.devnull, 'w')
    
    # Run tests
    success = run_ci_tests(
        accuracy_threshold=args.accuracy_threshold,
        performance_threshold=args.performance_threshold,
        output_file=args.output
    )
    
    # Restore stdout
    if args.quiet:
        sys.stdout = sys.__stdout__
    
    # Exit with appropriate code
    exit_code = 0 if success else 1
    
    if not args.quiet:
        print(f"\nExiting with code {exit_code}")
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main() 