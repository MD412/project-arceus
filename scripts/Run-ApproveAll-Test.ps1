# Runs the targeted Playwright spec that verifies Approve All removes empty scan from inbox
# Version: 1.0.0
# Usage: ./scripts/Run-ApproveAll-Test.ps1
# Example: pwsh -File scripts/Run-ApproveAll-Test.ps1

param()

Write-Host "Running Playwright test: approve-all-removes-empty-scan.spec.ts" -ForegroundColor Cyan

# Ensure Playwright reuses the existing Next.js server per config (reuseExistingServer: !CI)
if (Test-Path Env:CI) { Remove-Item Env:CI }

npx playwright test tests/approve-all-removes-empty-scan.spec.ts --reporter=line --project=chromium

if ($LASTEXITCODE -ne 0) {
  Write-Host "Test failed" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host "Test passed" -ForegroundColor Green

