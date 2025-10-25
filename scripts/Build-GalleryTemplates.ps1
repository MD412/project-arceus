<#
.SYNOPSIS
Populate the card_templates table with OpenCLIP embeddings for gallery templates.

.DESCRIPTION
Runs scripts/embed_gallery.py to create official art and augmentation templates
for each Pokemon TCG card using the ViT-L/14-336 embedder.

.PARAMETER Limit
Optional cap on the number of cards processed for quick validation runs.

.PARAMETER StartAfter
Card ID to resume after (exclusive). Helpful for resumable batches.

.PARAMETER DisableBrightness
Skip the brightness augmentation template.

.PARAMETER DryRun
Compute embeddings without writing to Supabase.

.PARAMETER ExtraArgs
Additional arguments forwarded verbatim to embed_gallery.py.

.EXAMPLE
pwsh -File scripts/Build-GalleryTemplates.ps1 -Limit 25 -DryRun

.NOTES
Version: 1.0.0
Author: Project Arceus
#>

param(
  [int]$Limit,
  [string]$StartAfter,
  [switch]$DisableBrightness,
  [switch]$DryRun,
  [string[]]$ExtraArgs
)

$ErrorActionPreference = 'Stop'

$pythonArgs = @('scripts/embed_gallery.py')

if ($PSBoundParameters.ContainsKey('Limit')) {
  $pythonArgs += @('--limit', $Limit)
}

if ($PSBoundParameters.ContainsKey('StartAfter')) {
  $pythonArgs += @('--start-after', $StartAfter)
}

if ($DisableBrightness.IsPresent) {
  $pythonArgs += '--disable-brightness'
}

if ($DryRun.IsPresent) {
  $pythonArgs += '--dry-run'
}

if ($ExtraArgs) {
  $pythonArgs += $ExtraArgs
}

Write-Host '[INFO] Building gallery templates...' -ForegroundColor Cyan
Write-Host "python $($pythonArgs -join ' ')" -ForegroundColor DarkGray

python @pythonArgs

if ($LASTEXITCODE -ne 0) {
  Write-Host "[ERROR] Gallery template build failed with code $LASTEXITCODE" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host '[OK] Gallery templates build complete.' -ForegroundColor Green
exit 0

