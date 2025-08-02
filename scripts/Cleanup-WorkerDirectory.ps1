# Cleanup-WorkerDirectory.ps1
# Safely removes unused files from the worker directory
# Author: AI Assistant
# Version: 1.0
# Description: Removes deprecated worker versions, test files, and experimental modules while preserving active production code

Write-Host "🧹 Worker Directory Cleanup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "worker/worker.py")) {
    Write-Host "❌ Error: worker.py not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found worker.py - proceeding with cleanup..." -ForegroundColor Green

# Create archive directory
$archiveDir = "worker/archive"
if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir | Out-Null
    Write-Host "📁 Created archive directory: $archiveDir" -ForegroundColor Yellow
}

# Phase 1: Remove old worker versions
Write-Host "`n🗑️ Phase 1: Removing old worker versions..." -ForegroundColor Yellow
$oldWorkers = @(
    "worker/production_worker.py",
    "worker/normalized_worker.py"
)

foreach ($file in $oldWorkers) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Not found: $file" -ForegroundColor Yellow
    }
}

# Phase 2: Remove experimental files
Write-Host "`n🗑️ Phase 2: Removing experimental files..." -ForegroundColor Yellow
$experimentalFiles = @(
    "worker/siglip_identifier.py",
    "worker/requirements_siglip.txt",
    "worker/gpt4_vision_identifier.py",
    "worker/monitor_ai_performance.py"
)

foreach ($file in $experimentalFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Not found: $file" -ForegroundColor Yellow
    }
}

# Phase 3: Remove test files
Write-Host "`n🗑️ Phase 3: Removing test files..." -ForegroundColor Yellow
$testFiles = @(
    "worker/test_gpt4_mock.py",
    "worker/test_gpt4_prompt.py",
    "worker/test_with_visuals.py",
    "worker/test_with_visuals_fixed.py"
)

foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Not found: $file" -ForegroundColor Yellow
    }
}

# Remove test fixtures directory
if (Test-Path "worker/test_fixtures") {
    Remove-Item "worker/test_fixtures" -Recurse -Force
    Write-Host "  ✅ Removed: worker/test_fixtures/" -ForegroundColor Green
}

# Phase 4: Remove utility files
Write-Host "`n🗑️ Phase 4: Removing utility files..." -ForegroundColor Yellow
$utilityFiles = @(
    "worker/precompute_hashes.py",
    "worker/upload_to_huggingface.py"
)

foreach ($file in $utilityFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Not found: $file" -ForegroundColor Yellow
    }
}

# Phase 5: Clean output directories
Write-Host "`n🗑️ Phase 5: Cleaning output directories..." -ForegroundColor Yellow
$outputDirs = @(
    "worker/output",
    "worker/output_fixed",
    "worker/logs",
    "worker/training_data"
)

foreach ($dir in $outputDirs) {
    if (Test-Path $dir) {
        Remove-Item $dir -Recurse -Force
        Write-Host "  ✅ Removed: $dir/" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Not found: $dir/" -ForegroundColor Yellow
    }
}

# Phase 6: Archive documentation
Write-Host "`n📁 Phase 6: Archiving documentation..." -ForegroundColor Yellow

# Archive Plans directory
if (Test-Path "worker/Plans") {
    Move-Item "worker/Plans" "worker/archive/" -Force
    Write-Host "  ✅ Archived: worker/Plans/ → worker/archive/" -ForegroundColor Green
}

# Archive documentation files
$docFiles = @(
    "worker/PREMIUM_LAUNCH_SUMMARY.md",
    "worker/README.md"
)

foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Move-Item $file "worker/archive/" -Force
        Write-Host "  ✅ Archived: $file → worker/archive/" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Not found: $file" -ForegroundColor Yellow
    }
}

# Archive cost tracking files
$costFiles = Get-ChildItem "worker" -Filter "gpt4_costs_*.json" -ErrorAction SilentlyContinue
foreach ($file in $costFiles) {
    Move-Item $file.FullName "worker/archive/" -Force
    Write-Host "  ✅ Archived: $($file.Name) → worker/archive/" -ForegroundColor Green
}

$testResultFiles = Get-ChildItem "worker" -Filter "gpt4_test_results_*.json" -ErrorAction SilentlyContinue
foreach ($file in $testResultFiles) {
    Move-Item $file.FullName "worker/archive/" -Force
    Write-Host "  ✅ Archived: $($file.Name) → worker/archive/" -ForegroundColor Green
}

# Phase 7: Verification
Write-Host "`n✅ Phase 7: Verification..." -ForegroundColor Yellow

$requiredFiles = @(
    "worker/worker.py",
    "worker/clip_lookup.py", 
    "worker/config.py",
    "worker/auto_recovery_system.py",
    "worker/requirements.txt",
    "worker/pokemon_cards_trained.pt",
    "worker/yolov8s.pt"
)

$allGood = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Missing: $file" -ForegroundColor Red
        $allGood = $false
    }
}

# Summary
Write-Host "`n📊 Cleanup Summary" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✅ All required files are present!" -ForegroundColor Green
    Write-Host "✅ Cleanup completed successfully!" -ForegroundColor Green
    Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Test worker.py to ensure it starts correctly" -ForegroundColor White
    Write-Host "  2. Verify CLIP system loads without errors" -ForegroundColor White
    Write-Host "  3. Check auto-recovery system functionality" -ForegroundColor White
    Write-Host "  4. Review archived files in worker/archive/ if needed" -ForegroundColor White
} else {
    Write-Host "❌ Some required files are missing!" -ForegroundColor Red
    Write-Host "Please check the missing files above." -ForegroundColor Red
}

Write-Host "`n🧹 Worker directory cleanup complete!" -ForegroundColor Cyan 