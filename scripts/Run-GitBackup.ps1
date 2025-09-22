# Run-GitBackup.ps1
# Description: Create a full Git backup: commit any changes, tag, create branch, and push to origin.
#
# Purpose: Convenience wrapper around New-GitSnapshot.ps1 that also force-updates a backup branch
# and ensures the remote main is pushed regardless of whether there were new commits.
# Parameters:
#   -Name <string>  Backup name (used for tag and branch). Default: backup-YYYYMMDD-HHmmss
#   -Message <string> Optional custom message. Default: "backup: <Name>"
#   -NoBranch        Skip creating/updating the backup branch
#   -NoTag           Skip creating the backup tag
# Examples:
#   ./scripts/Run-GitBackup.ps1
#   ./scripts/Run-GitBackup.ps1 -Name "backup-20250922-1200"
#   ./scripts/Run-GitBackup.ps1 -Name nightly-2025-09-22 -NoBranch
# Version History:
#   1.0.0 - 2025-09-22 - Initial script

[CmdletBinding()]
param(
  [string]$Name,
  [string]$Message,
  [switch]$NoBranch,
  [switch]$NoTag
)

set-strictmode -version latest
$ErrorActionPreference = 'Stop'

function Assert-ToolExists {
  param([string]$Tool)
  if (-not (Get-Command $Tool -ErrorAction SilentlyContinue)) {
    throw "Required tool not found in PATH: $Tool"
  }
}

Assert-ToolExists -Tool 'git'

git rev-parse --is-inside-work-tree | Out-Null

$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
if (-not $Name -or [string]::IsNullOrWhiteSpace($Name)) { $Name = "backup-$ts" }
if (-not $Message -or [string]::IsNullOrWhiteSpace($Message)) { $Message = "backup: $Name" }

$currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host "Starting full backup on branch: $currentBranch"

# Build args for snapshot
# Call snapshot script with explicit named parameters
if (-not $NoTag) {
  & "$PSScriptRoot/New-GitSnapshot.ps1" -Message $Message -Tag $Name
} else {
  & "$PSScriptRoot/New-GitSnapshot.ps1" -Message $Message
}

# Always push current branch to origin to ensure remote is synced
try { git push | Out-Null } catch { Write-Warning "Push main failed: $($_.Exception.Message)" }

# Create/force-update backup branch with a distinct name to avoid tag collisions and push
if (-not $NoBranch) {
  $branchName = "$Name-branch"
  git branch -f $branchName | Out-Null
  try { git push -u origin $branchName -f | Out-Null } catch { Write-Warning "Push backup branch failed: $($_.Exception.Message)" }
}

# Push tag if created and not yet pushed (snapshot script already attempts it)
if (-not $NoTag) {
  try { git push origin $Name | Out-Null } catch { }
}

Write-Host "Backup complete: $Name"


