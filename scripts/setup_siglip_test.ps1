# SigLIP Test Setup Script for Project Arceus
# Purpose: Set up SigLIP testing environment and verify installation
# Parameters: None
# Examples: .\setup_siglip_test.ps1
# Version: 1.0

Write-Host "=== Project Arceus: SigLIP Test Setup ===" -ForegroundColor Green
Write-Host "Setting up SigLIP testing environment" -ForegroundColor Yellow

# Check if we're in the right directory
if (-not (Test-Path "worker")) {
    Write-Host "Error: Must run from project root directory" -ForegroundColor Red
    exit 1
}

# Check if we're on the siglip-test branch
$currentBranch = git branch --show-current
if ($currentBranch -ne "siglip-test") {
    Write-Host "Warning: Not on siglip-test branch. Current branch: $currentBranch" -ForegroundColor Yellow
    Write-Host "Consider running: git checkout siglip-test" -ForegroundColor Cyan
}

# Activate GPU environment if it exists
if (Test-Path ".venv-gpu") {
    Write-Host "Activating GPU environment..." -ForegroundColor Cyan
    & ".venv-gpu\Scripts\Activate.ps1"
} else {
    Write-Host "Warning: No .venv-gpu found, using current environment" -ForegroundColor Yellow
}

# Step 1: Install SigLIP dependencies
Write-Host "`n=== Step 1: Installing SigLIP Dependencies ===" -ForegroundColor Green
try {
    Write-Host "Installing PyTorch with CUDA support..." -ForegroundColor Cyan
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
    
    Write-Host "Installing open-clip-torch..." -ForegroundColor Cyan
    pip install open-clip-torch
    
    Write-Host "Installing other dependencies..." -ForegroundColor Cyan
    pip install -r worker/requirements_siglip.txt
    
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Error installing dependencies: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Test SigLIP setup
Write-Host "`n=== Step 2: Testing SigLIP Setup ===" -ForegroundColor Green
try {
    python scripts/test_siglip_setup.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SigLIP setup test completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ SigLIP setup test failed" -ForegroundColor Red
        Write-Host "Check the error messages above for troubleshooting" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Error running SigLIP setup test: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Quick test with sample data
Write-Host "`n=== Step 3: Quick Test with Sample Data ===" -ForegroundColor Green
try {
    # Check if we have any test images
    if (Test-Path "worker/test_fixtures") {
        Write-Host "Found test fixtures, running quick test..." -ForegroundColor Cyan
        python scripts/evaluate_baseline.py
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Quick test completed successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Quick test had issues, but setup is complete" -ForegroundColor Yellow
        }
    } else {
        Write-Host "No test fixtures found, skipping quick test" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Quick test failed, but setup is complete" -ForegroundColor Yellow
}

Write-Host "`n=== SigLIP Test Setup Complete ===" -ForegroundColor Green
Write-Host "Your SigLIP test environment is ready!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test with your training data: python scripts/evaluate_baseline.py" -ForegroundColor White
Write-Host "2. Compare CLIP vs SigLIP: python scripts/compare_clip_siglip.py" -ForegroundColor White
Write-Host "3. Run full evaluation: .\scripts\run_baseline_evaluation.ps1" -ForegroundColor White
Write-Host ""
Write-Host "To switch back to main branch: git checkout main" -ForegroundColor Cyan 