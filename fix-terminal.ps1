# Fix terminal and restore codebase
# This script bypasses the pager issues

Write-Host "=== Fixing Terminal and Restoring Codebase ===" -ForegroundColor Green

# Set environment variables to prevent pager issues
$env:GIT_PAGER = ""
$env:LESS = ""

# Clean build artifacts
Write-Host "Cleaning build artifacts..." -ForegroundColor Yellow
if (Test-Path ".next") { 
    Remove-Item -Recurse -Force ".next" 
    Write-Host "Removed .next directory" -ForegroundColor Green
}

if (Test-Path "node_modules") { 
    Remove-Item -Recurse -Force "node_modules" 
    Write-Host "Removed node_modules directory" -ForegroundColor Green
}

# Reset git changes (bypass pager)
Write-Host "Resetting git changes..." -ForegroundColor Yellow
git reset --hard HEAD 2>$null
git clean -fd 2>$null

# Reinstall dependencies
Write-Host "Reinstalling dependencies..." -ForegroundColor Yellow
npm install

# Test build
Write-Host "Testing build..." -ForegroundColor Yellow
npm run build

Write-Host "=== Restore Complete ===" -ForegroundColor Green
Write-Host "Your codebase should now be working!" -ForegroundColor Green 