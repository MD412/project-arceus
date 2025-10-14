# Open Playwright Inspector and run the approve-all test interactively (headed)
# Version: 1.0.0
# Usage: pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -File scripts/Run-ApproveAll-TestInteractive.ps1

param()

Write-Host "Opening Playwright Inspector for approve-all test..." -ForegroundColor Cyan

# Ensure Playwright reuses existing Next.js dev server
if (Test-Path Env:CI) { Remove-Item Env:CI }

# Optional: hold the page briefly at the end for visual confirmation
$env:HOLD_OPEN = "1"

npx playwright test tests/approve-all-removes-empty-scan.spec.ts --project=chromium --headed --debug --reporter=list

if ($LASTEXITCODE -ne 0) {
  Write-Host "Interactive run failed" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host "Interactive run finished" -ForegroundColor Green

















































