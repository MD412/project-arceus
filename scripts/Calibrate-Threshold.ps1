<#
.SYNOPSIS
Run Phase 4 threshold calibration for retrieval v2.

.DESCRIPTION
Sweeps UNKNOWN_THRESHOLD over real card crops to find optimal value targeting ≥99% precision.

.EXAMPLE
pwsh -File scripts/Calibrate-Threshold.ps1

.NOTES
Version: 1.0.0
Author: Project Arceus
#>

$ErrorActionPreference = 'Stop'

Write-Host '[INFO] Running Phase 4: Threshold Calibration' -ForegroundColor Cyan
Write-Host 'python scripts/calibrate_threshold.py' -ForegroundColor DarkGray

python scripts/calibrate_threshold.py

if ($LASTEXITCODE -ne 0) {
  Write-Host "[ERROR] Calibration failed with code $LASTEXITCODE" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host '[OK] Threshold calibration complete.' -ForegroundColor Green
exit 0

