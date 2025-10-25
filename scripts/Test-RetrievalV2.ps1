<#
.SYNOPSIS
Dry-run retrieval v2 against a single image crop.

.DESCRIPTION
Invokes scripts/test_retrieval_v2.py to run the gallery ANN + prototype fusion
pipeline without modifying database state. Helpful for spot-checking candidates.

.PARAMETER ImagePath
Path to the crop image (required).

.PARAMETER SetId
Optional set hint passed to the ANN RPC (respected when SET_PREFILTER is enabled).

.PARAMETER TopK
Override value for retrieval TOPK (defaults to config).

.PARAMETER ExtraArgs
Additional arguments forwarded to the Python script.

.EXAMPLE
pwsh -File scripts/Test-RetrievalV2.ps1 -ImagePath .\crop.png -SetId sv1

.NOTES
Version: 1.0.0
Author: Project Arceus
#>

param(
  [Parameter(Mandatory = $true)]
  [string]$ImagePath,
  [string]$SetId,
  [int]$TopK,
  [string[]]$ExtraArgs
)

$ErrorActionPreference = 'Stop'

$pythonArgs = @('scripts/test_retrieval_v2.py', $ImagePath)

if ($PSBoundParameters.ContainsKey('SetId')) {
  $pythonArgs += @('--set-id', $SetId)
}

if ($PSBoundParameters.ContainsKey('TopK')) {
  $pythonArgs += @('--topk', $TopK)
}

if ($ExtraArgs) {
  $pythonArgs += $ExtraArgs
}

Write-Host '[INFO] Running retrieval v2 dry run...' -ForegroundColor Cyan
Write-Host "python $($pythonArgs -join ' ')" -ForegroundColor DarkGray

# Ensure Python can import the 'worker' package by adding project root to PYTHONPATH
$projectRoot = (Get-Item "$PSScriptRoot\..\").FullName
if ($env:PYTHONPATH) {
  $env:PYTHONPATH = "$projectRoot;$env:PYTHONPATH"
} else {
  $env:PYTHONPATH = $projectRoot
}

python @pythonArgs

if ($LASTEXITCODE -ne 0) {
  Write-Host "[ERROR] Retrieval v2 test failed with code $LASTEXITCODE" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host '[OK] Retrieval v2 test completed.' -ForegroundColor Green
exit 0

