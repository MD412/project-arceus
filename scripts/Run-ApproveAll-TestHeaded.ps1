# Run the Approve-All Playwright spec in a headed Chromium window so you can watch it
# Version: 1.0.0
# Usage: ./scripts/Run-ApproveAll-TestHeaded.ps1
# Example: pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -File scripts/Run-ApproveAll-TestHeaded.ps1

param()

Write-Host "Opening Chromium and running approve-all test (headed)..." -ForegroundColor Cyan

# Ensure Playwright reuses the existing Next.js dev server per config (reuseExistingServer: !CI)
if (Test-Path Env:CI) { Remove-Item Env:CI }

npx playwright test tests/approve-all-removes-empty-scan.spec.ts --headed --project=chromium --reporter=list

if ($LASTEXITCODE -ne 0) {
  Write-Host "Test run failed" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host "Test run completed" -ForegroundColor Green




















































































