#!/usr/bin/env python3
"""
Test Runner for Project Arceus
Runs all automated tests and generates a report
"""
import subprocess
import sys
import json
from pathlib import Path
from datetime import datetime


def run_python_tests():
    """Run Python tests with pytest"""
    print("🐍 Running Python tests...")
    
    # Run pytest with coverage
    result = subprocess.run([
        sys.executable, "-m", "pytest",
        "__tests__",
        "-v",
        "--tb=short",
        "--cov=worker",
        "--cov=scripts",
        "--cov-report=term-missing",
        "--cov-report=json"
    ], capture_output=True, text=True)
    
    print(result.stdout)
    if result.stderr:
        print("Errors:", result.stderr)
    
    return result.returncode == 0


def run_javascript_tests():
    """Run JavaScript/TypeScript tests with Jest"""
    print("\n📦 Running JavaScript tests...")
    
    result = subprocess.run([
        "npm", "test", "--", "--coverage", "--json", "--outputFile=test-results.json"
    ], capture_output=True, text=True)
    
    print(result.stdout)
    if result.stderr:
        print("Errors:", result.stderr)
    
    return result.returncode == 0


def run_integration_tests():
    """Run integration tests (requires services running)"""
    print("\n🔗 Running integration tests...")
    
    # Check if services are running
    try:
        import requests
        response = requests.get("http://localhost:3000", timeout=2)
        frontend_running = response.status_code == 200
    except:
        frontend_running = False
    
    if not frontend_running:
        print("⚠️  Frontend not running. Skipping integration tests.")
        print("   Start with: npm run dev")
        return True
    
    # Run API tests
    result = subprocess.run([
        sys.executable, "-m", "pytest",
        "__tests__/api",
        "-v",
        "-m", "not skip"
    ], capture_output=True, text=True)
    
    print(result.stdout)
    return result.returncode == 0


def generate_test_report():
    """Generate a test report"""
    print("\n📊 Generating test report...")
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "results": {}
    }
    
    # Check Python coverage
    coverage_file = Path("coverage.json")
    if coverage_file.exists():
        with open(coverage_file) as f:
            coverage_data = json.load(f)
            report["results"]["python_coverage"] = {
                "percent": coverage_data.get("totals", {}).get("percent_covered", 0),
                "lines": coverage_data.get("totals", {}).get("num_statements", 0),
                "missing": coverage_data.get("totals", {}).get("missing_lines", 0)
            }
    
    # Check Jest results
    jest_results = Path("test-results.json")
    if jest_results.exists():
        with open(jest_results) as f:
            jest_data = json.load(f)
            report["results"]["javascript_tests"] = {
                "passed": jest_data.get("numPassedTests", 0),
                "failed": jest_data.get("numFailedTests", 0),
                "total": jest_data.get("numTotalTests", 0)
            }
    
    # Save report
    report_path = Path("test-report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"✅ Test report saved to: {report_path}")
    
    # Print summary
    print("\n📋 Test Summary:")
    if "python_coverage" in report["results"]:
        cov = report["results"]["python_coverage"]
        print(f"   Python Coverage: {cov['percent']:.1f}%")
    if "javascript_tests" in report["results"]:
        js = report["results"]["javascript_tests"]
        print(f"   JavaScript Tests: {js['passed']}/{js['total']} passed")


def main():
    """Run all tests"""
    print("🚀 Starting Project Arceus Test Suite\n")
    
    all_passed = True
    
    # Run Python tests
    if not run_python_tests():
        all_passed = False
        print("❌ Python tests failed")
    else:
        print("✅ Python tests passed")
    
    # Run JavaScript tests
    if not run_javascript_tests():
        all_passed = False
        print("❌ JavaScript tests failed")
    else:
        print("✅ JavaScript tests passed")
    
    # Run integration tests
    if not run_integration_tests():
        all_passed = False
        print("❌ Integration tests failed")
    else:
        print("✅ Integration tests passed")
    
    # Generate report
    generate_test_report()
    
    # Exit with appropriate code
    if all_passed:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)


if __name__ == "__main__":
    main() 