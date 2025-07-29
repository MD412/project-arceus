#!/usr/bin/env python3
"""
Simple CLIP testing script for CI/CD environments
Avoids PowerShell Unicode and variable interpolation issues
"""
import sys
import os
import json
import argparse

# Add paths
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'worker'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '__tests__', 'ocr'))

def main():
    parser = argparse.ArgumentParser(description="Simple CLIP testing for CI/CD")
    parser.add_argument("--mode", choices=["accuracy", "performance", "ci"], 
                       default="ci", help="Test mode")
    parser.add_argument("--output", help="JSON output file")
    parser.add_argument("--accuracy-threshold", type=float, default=67.0)
    parser.add_argument("--performance-threshold", type=float, default=2000.0)
    
    args = parser.parse_args()
    
    print("Project Arceus CLIP Testing")
    print(f"Mode: {args.mode}")
    print("-" * 40)
    
    try:
        from test_clip_automation import CLIPTestSuite
        suite = CLIPTestSuite()
        
        if args.mode == "accuracy":
            # Run accuracy test only
            result = suite.run_accuracy_test(similarity_threshold=0.75)
            print(f"Accuracy: {result['accuracy_percent']:.1f}%")
            print(f"Duration: {result['avg_duration_ms']:.1f}ms")
            success = result['accuracy_percent'] >= args.accuracy_threshold
            print(f"Result: {'PASS' if success else 'FAIL'}")
            return 0 if success else 1
            
        elif args.mode == "performance":
            # Run performance test only
            result = suite.run_performance_benchmark(iterations=3)
            if "error" in result:
                print(f"Error: {result['error']}")
                return 1
            avg_duration = result['avg_duration_ms']
            print(f"Avg Duration: {avg_duration:.1f}ms")
            success = avg_duration <= args.performance_threshold
            print(f"Result: {'PASS' if success else 'FAIL'}")
            return 0 if success else 1
            
        else:  # ci mode
            # Run comprehensive CI tests
            accuracy_result = suite.run_accuracy_test(similarity_threshold=0.75)
            performance_result = suite.run_performance_benchmark(iterations=3)
            
            accuracy_pass = accuracy_result['accuracy_percent'] >= args.accuracy_threshold
            performance_pass = (
                "error" not in performance_result and 
                performance_result['avg_duration_ms'] <= args.performance_threshold
            )
            
            print(f"Accuracy: {accuracy_result['accuracy_percent']:.1f}% " +
                  f"({'PASS' if accuracy_pass else 'FAIL'} >= {args.accuracy_threshold}%)")
            
            if "error" not in performance_result:
                print(f"Performance: {performance_result['avg_duration_ms']:.1f}ms " +
                      f"({'PASS' if performance_pass else 'FAIL'} <= {args.performance_threshold}ms)")
            else:
                print(f"Performance: FAIL ({performance_result['error']})")
            
            overall_pass = accuracy_pass and performance_pass
            print(f"Overall: {'PASS' if overall_pass else 'FAIL'}")
            
            # Write JSON if requested
            if args.output:
                result_data = {
                    "timestamp": accuracy_result.get("timestamp", "unknown"),
                    "mode": "ci",
                    "accuracy_percent": accuracy_result['accuracy_percent'],
                    "accuracy_threshold": args.accuracy_threshold,
                    "accuracy_pass": accuracy_pass,
                    "performance_ms": performance_result.get('avg_duration_ms', 0),
                    "performance_threshold": args.performance_threshold,
                    "performance_pass": performance_pass,
                    "overall_pass": overall_pass
                }
                
                with open(args.output, 'w') as f:
                    json.dump(result_data, f, indent=2)
                print(f"Results written to: {args.output}")
            
            return 0 if overall_pass else 1
            
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 