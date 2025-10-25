<#
.SYNOPSIS
Aggregate card_templates into card_prototypes with normalized mean embeddings.

.DESCRIPTION
Runs scripts/build_prototypes.py to compute per-card prototype vectors and
upsert them into the Supabase database.

.PARAMETER CardId
Optional card ID(s) to restrict processing. Provide multiple values to process several cards.

.PARAMETER DryRun
Compute prototype vectors without writing to the database.

.PARAMETER ExtraArgs
Additional arguments forwarded verbatim to build_prototypes.py.

.EXAMPLE
pwsh -File scripts/Build-CardPrototypes.ps1 -CardId sv1-1 -DryRun

.NOTES
Version: 1.0.0
Author: Project Arceus
#>

param(
  [string[]]$CardId,
  [switch]$DryRun,
  [string[]]$ExtraArgs
)

$ErrorActionPreference = 'Stop'

$pythonArgs = @('scripts/build_prototypes.py')

if ($CardId) {
  foreach ($id in $CardId) {
    $pythonArgs += @('--card-id', $id)
  }
}

if ($DryRun.IsPresent) {
  $pythonArgs += '--dry-run'
}

if ($ExtraArgs) {
  $pythonArgs += $ExtraArgs
}

Write-Host '[INFO] Building card prototypes...' -ForegroundColor Cyan
Write-Host "python $($pythonArgs -join ' ')" -ForegroundColor DarkGray

python @pythonArgs

if ($LASTEXITCODE -ne 0) {
  Write-Host "[ERROR] Prototype build failed with code $LASTEXITCODE" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host '[OK] Card prototypes build complete.' -ForegroundColor Green
exit 0

