# Description: Starts the Normalized Worker (v3) for Project Arceus using the .venv-gpu environment if present.
<#!
.SYNOPSIS
Starts the Project Arceus worker.

.DESCRIPTION
Runs worker/worker.py using the local Python environment. Prefers .venv-gpu if available.
Includes minimal environment diagnostics and clear output.

.PARAMETER ModelPath
Optional path to a YOLO model file. Defaults to worker/pokemon_cards_trained.pt

.EXAMPLE
pwsh -File scripts/Run-Worker.ps1

.EXAMPLE
pwsh -File scripts/Run-Worker.ps1 -ModelPath "C:\Models\pokemon_cards_trained.pt"

.NOTES
Version: 1.0.0
History:
  - 1.0.0 Initial version
!#>

param(
  [string]$ModelPath = "worker/pokemon_cards_trained.pt"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-PythonPath {
  $venvGpu = Join-Path -Path $PSScriptRoot -ChildPath "..\.venv-gpu\Scripts\python.exe"
  $venv = Join-Path -Path $PSScriptRoot -ChildPath "..\.venv\Scripts\python.exe"
  if (Test-Path $venvGpu) { return $venvGpu }
  if (Test-Path $venv) { return $venv }
  return "python"
}

function Test-IsWindows { $IsWindows }

Write-Host "[INFO] Starting worker launcher..."
if (-not (Test-IsWindows)) {
  Write-Warning "This script is optimized for Windows PowerShell environments."
}

$python = Get-PythonPath
Write-Host "[INFO] Using Python: $python"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

if (-not (Test-Path "worker\worker.py")) {
  throw "worker/worker.py not found. Ensure you are at the repo root: $repoRoot"
}

$env:PYTHONUNBUFFERED = "1"

if ($ModelPath) {
  Write-Host "[INFO] YOLO model: $ModelPath"
}

Write-Host "[START] Launching worker... (Ctrl+C to stop)"
& $python "worker\worker.py"




