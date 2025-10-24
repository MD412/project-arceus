<#
.SYNOPSIS
Runs the OpenCLIP embedder smoke test to validate embeddings and performance.

.DESCRIPTION
Executes scripts/test_embedder_smoke.py non-interactively. Exits with the script's code.

.EXAMPLE
pwsh -File scripts/Test-EmbedderSmoke.ps1

.NOTES
Version: 1.0.0
Author: Project Arceus
#>

param()

$ErrorActionPreference = 'Stop'

Write-Host '[INFO] Running embedder smoke test...' -ForegroundColor Cyan

python scripts/test_embedder_smoke.py

if ($LASTEXITCODE -ne 0) {
  Write-Host "[ERROR] Smoke test failed with code $LASTEXITCODE" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host '[OK] Smoke test passed.' -ForegroundColor Green
exit 0


