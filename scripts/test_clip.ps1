#!/usr/bin/env pwsh
<#
.SYNOPSIS
Automated CLIP testing script for Project Arceus

.DESCRIPTION
Provides easy commands to test CLIP accuracy and performance
Supports both comprehensive testing and CI/CD integration

.PARAMETER Mode
Test mode: 'full', 'accuracy', 'performance', 'ci'

.PARAMETER OutputFile  
Optional JSON file to write test results

.PARAMETER AccuracyThreshold
Minimum accuracy percentage for CI mode (default: 67)

.PARAMETER PerformanceThreshold
Maximum average duration in ms for CI mode (default: 2000)

.EXAMPLE
.\test_clip.ps1 -Mode full
Run comprehensive CLIP testing suite

.EXAMPLE  
.\test_clip.ps1 -Mode ci -OutputFile results.json
Run CI tests with JSON output

.EXAMPLE
.\test_clip.ps1 -Mode accuracy
Run just accuracy tests
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("full", "accuracy", "performance", "ci")]
    [string]$Mode,
    
    [string]$OutputFile = "",
    
    [double]$AccuracyThreshold = 67.0,
    
    [double]$PerformanceThreshold = 2000.0
)

# Change to project root if needed
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Push-Location $projectRoot

Write-Host "Project Arceus CLIP Testing Suite" -ForegroundColor Cyan
Write-Host "Mode: $Mode" -ForegroundColor Green

try {
    switch ($Mode) {
        "full" {
            Write-Host "`nRunning comprehensive CLIP test suite..." -ForegroundColor Yellow
            py __tests__/ocr/test_clip_automation.py
        }
        
        "accuracy" {
            Write-Host "`nRunning CLIP accuracy test..." -ForegroundColor Yellow
            py -m pytest __tests__/ocr/test_clip_automation.py::test_clip_accuracy -v
        }
        
        "performance" {
            Write-Host "`nRunning CLIP performance test..." -ForegroundColor Yellow
            py -m pytest __tests__/ocr/test_clip_automation.py::test_clip_performance -v
        }
        
        "ci" {
            Write-Host "`nRunning CI/CD tests..." -ForegroundColor Yellow
            
            # Run pytest tests
            Write-Host "Running pytest validation..." -ForegroundColor Cyan
            $pytestResult = py -m pytest __tests__/ocr/test_clip_automation.py -q
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "PASS: All pytest tests passed" -ForegroundColor Green
                
                # Calculate simple metrics
                Write-Host "`nCalculating metrics..." -ForegroundColor Cyan
                
                $metricsScript = @"
import sys, os
sys.path.insert(0, os.path.join(os.getcwd(), 'worker'))
sys.path.insert(0, os.path.join(os.getcwd(), '__tests__', 'ocr'))

from test_clip_automation import CLIPTestSuite
suite = CLIPTestSuite()
result = suite.run_accuracy_test(similarity_threshold=0.75)

print(f"Accuracy: {result['accuracy_percent']:.1f}%")
print(f"Avg Duration: {result['avg_duration_ms']:.1f}ms")

# Check thresholds  
accuracy_pass = result['accuracy_percent'] >= $($AccuracyThreshold)
duration_pass = result['avg_duration_ms'] <= $($PerformanceThreshold)

print(f"Accuracy Threshold: {'PASS' if accuracy_pass else 'FAIL'} (>= $($AccuracyThreshold)%)")
print(f"Performance Threshold: {'PASS' if duration_pass else 'FAIL'} (<= $($PerformanceThreshold) ms)")

exit_code = 0 if (accuracy_pass and duration_pass) else 1
print(f"Overall: {'PASS' if exit_code == 0 else 'FAIL'}")
exit(exit_code)
"@
                
                $metricsResult = py -c $metricsScript
                $metricsExitCode = $LASTEXITCODE
                
                Write-Host $metricsResult -ForegroundColor White
                
                if ($OutputFile) {
                    # Create simple JSON output
                    $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
                    $jsonContent = @{
                        timestamp = $timestamp
                        mode = "ci"
                        pytest_passed = $true
                        metrics_passed = ($metricsExitCode -eq 0)
                        accuracy_threshold = $AccuracyThreshold
                        performance_threshold = $PerformanceThreshold
                        overall_passed = ($metricsExitCode -eq 0)
                    } | ConvertTo-Json -Depth 3
                    
                    $jsonContent | Out-File -FilePath $OutputFile -Encoding UTF8
                    Write-Host "`nResults written to: $OutputFile" -ForegroundColor Cyan
                }
                
                if ($metricsExitCode -eq 0) {
                    Write-Host "`nCI TESTS PASSED" -ForegroundColor Green
                    exit 0
                } else {
                    Write-Host "`nCI TESTS FAILED" -ForegroundColor Red
                    exit 1
                }
            } else {
                Write-Host "FAIL: Pytest tests failed" -ForegroundColor Red
                exit 1
            }
        }
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
} 