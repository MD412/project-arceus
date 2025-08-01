# Baseline Evaluation Script for Project Arceus
# Purpose: Evaluate current CLIP performance and compare with SigLIP
# Parameters: None
# Examples: .\run_baseline_evaluation.ps1
# Version: 1.0

Write-Host "=== Project Arceus: Baseline Evaluation ===" -ForegroundColor Green
Write-Host "Evaluating current CLIP performance and comparing with SigLIP" -ForegroundColor Yellow

# Check if we're in the right directory
if (-not (Test-Path "worker")) {
    Write-Host "Error: Must run from project root directory" -ForegroundColor Red
    exit 1
}

# Activate GPU environment if it exists
if (Test-Path ".venv-gpu") {
    Write-Host "Activating GPU environment..." -ForegroundColor Cyan
    & ".venv-gpu\Scripts\Activate.ps1"
} else {
    Write-Host "Warning: No .venv-gpu found, using current environment" -ForegroundColor Yellow
}

# Step 1: Run baseline evaluation
Write-Host "`n=== Step 1: Baseline CLIP Evaluation ===" -ForegroundColor Green
try {
    python scripts/evaluate_baseline.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Baseline evaluation completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Baseline evaluation failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running baseline evaluation: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Run CLIP vs SigLIP comparison
Write-Host "`n=== Step 2: CLIP vs SigLIP Comparison ===" -ForegroundColor Green
try {
    python scripts/compare_clip_siglip.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Model comparison completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Model comparison failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running model comparison: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Evaluation Complete ===" -ForegroundColor Green
Write-Host "Check the generated JSON files for detailed results" -ForegroundColor Yellow
Write-Host "Files created:" -ForegroundColor Cyan
Get-ChildItem -Name "baseline_evaluation_*.json" | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
Get-ChildItem -Name "clip_siglip_comparison_*.json" | ForEach-Object { Write-Host "  $_" -ForegroundColor White } 