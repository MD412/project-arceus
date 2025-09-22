# New-GitSnapshot.ps1
# Description: Create and push a lightweight Git snapshot commit (and optional tag) safely. Idempotent when no changes.
#
# Purpose: Stage all changes, commit with a message, optionally create a tag, and push to origin.
# Parameters:
#   -Message <string>  Commit message. Default: "snapshot: WIP"
#   -Tag <string>      Optional tag to create and push (annotated)
#   -NoPush            Do not push after commit/tag
# Examples:
#   ./scripts/New-GitSnapshot.ps1 -Message "snapshot: scans review layout before refactor"
#   ./scripts/New-GitSnapshot.ps1 -Message "snapshot: checkpoint" -Tag "checkpoint-20250922-1200"
# Version History:
#   1.0.0 - 2025-09-22 - Initial script

[CmdletBinding()]
param(
  [string]$Message = "snapshot: WIP",
  [string]$Tag,
  [switch]$NoPush
)

set-strictmode -version latest
$ErrorActionPreference = 'Stop'

function Assert-ToolExists {
  param([string]$Tool)
  if (-not (Get-Command $Tool -ErrorAction SilentlyContinue)) {
    throw "Required tool not found in PATH: $Tool"
  }
}

# Basic environment sanity checks
Assert-ToolExists -Tool 'git'

# Ensure we are inside a git repo
git rev-parse --is-inside-work-tree | Out-Null

# Determine current branch (for informational logging)
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host "Creating snapshot on branch: $branch"

# Stage changes
git add -A

# Detect if there is anything to commit
$status = git status --porcelain
$hasChanges = -not [string]::IsNullOrWhiteSpace($status)

if ($hasChanges) {
  git commit -m $Message | Out-Null
  Write-Host "Committed snapshot: $Message"
} else {
  Write-Host "No working tree changes. Skipping commit."
}

# Optional tag
if ($Tag) {
  # Create annotated tag if it doesn't already exist
  $tagExists = (git tag --list $Tag) -ne $null -and (git tag --list $Tag).Trim() -ne ''
  if (-not $tagExists) {
    git tag -a $Tag -m $Message | Out-Null
    Write-Host "Created tag: $Tag"
  } else {
    Write-Host "Tag already exists: $Tag (skipping creation)"
  }
}

if (-not $NoPush) {
  # Push branch (if new commit was created) and push tags if present
  try {
    if ($hasChanges) { git push | Out-Null }
  } catch { Write-Warning "Push branch failed: $($_.Exception.Message)" }

  if ($Tag) {
    try { git push origin $Tag | Out-Null } catch { Write-Warning "Push tag failed: $($_.Exception.Message)" }
  }
  Write-Host "Push complete."
}

Write-Host "Snapshot complete."


