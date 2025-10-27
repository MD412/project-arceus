<#
.SYNOPSIS
Rewrites git history to remove a file (e.g., .cursor/mcp.json) and optionally force-pushes.

.DESCRIPTION
Uses `git filter-repo` to remove all occurrences of a path from the repository history.
Creates a timestamped backup branch before rewriting. Optionally force-pushes updated refs.

.PARAMETER TargetPath
Repository-relative path to remove from history. Default: .cursor/mcp.json

.PARAMETER Remote
The remote name to push to when -ForcePush is used. Default: origin

.PARAMETER ForcePush
If set, pushes rewritten branches and tags with --force-with-lease.

.EXAMPLE
# Dry run rewrite without pushing
./scripts/Rewrite-GitHistory-RemoveFile.ps1 -TargetPath .cursor/mcp.json

.EXAMPLE
# Rewrite and push to origin
./scripts/Rewrite-GitHistory-RemoveFile.ps1 -TargetPath .cursor/mcp.json -ForcePush

.NOTES
Requires: git, git-filter-repo (https://github.com/newren/git-filter-repo)
Version: 1.0.0
History:
- 1.0.0 (2025-10-25): Initial version
#>

param(
    [string]$TargetPath = '.cursor/mcp.json',
    [string]$Remote = 'origin',
    [switch]$ForcePush
)

$ErrorActionPreference = 'Stop'

function Assert-Windows {
    if (-not ($IsWindows)) {
        throw 'This script is intended for Windows PowerShell environments.'
    }
}

function Assert-GitPresent {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw 'git is not installed or not available on PATH.'
    }
}

function Assert-FilterRepoPresent {
    try {
        git filter-repo --help 1>$null 2>$null
    } catch {
        throw 'git filter-repo is not installed. Install from https://github.com/newren/git-filter-repo and retry.'
    }
}

function Get-RepoRoot {
    $root = (git rev-parse --show-toplevel) 2>$null
    if (-not $root) { throw 'Not inside a git repository.' }
    return $root
}

function Ensure-InRepoRoot {
    param([string]$RepoRoot)
    Set-Location $RepoRoot
}

function Create-BackupBranch {
    $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backup = "backup/pre-rewrite-$ts"
    git branch $backup | Out-Null
    Write-Host "Created backup branch: $backup" -ForegroundColor Yellow
}

function Rewrite-History {
    param([string]$PathToRemove)
    Write-Host "Rewriting history to remove: $PathToRemove" -ForegroundColor Cyan
    git filter-repo --invert-paths --path "$PathToRemove" --force
}

function Cleanup-OriginalRefs {
    git for-each-ref --format='%(refname)' refs/original | ForEach-Object { git update-ref -d $_ } | Out-Null
    git gc --prune=now --aggressive | Out-Null
}

function Push-RewrittenRefs {
    param([string]$RemoteName)
    # Verify remote exists
    $remotes = git remote 2>$null
    if (-not ($remotes -match "^$([regex]::Escape($RemoteName))$")) {
        throw "Remote '$RemoteName' not found."
    }
    Write-Host "Force-pushing rewritten refs to $RemoteName" -ForegroundColor Yellow
    git push --force-with-lease $RemoteName --all
    git push --force-with-lease $RemoteName --tags
}

try {
    Assert-Windows
    Assert-GitPresent
    Assert-FilterRepoPresent
    $repoRoot = Get-RepoRoot
    Ensure-InRepoRoot -RepoRoot $repoRoot
    Create-BackupBranch
    Rewrite-History -PathToRemove $TargetPath
    Cleanup-OriginalRefs
    if ($ForcePush) { Push-RewrittenRefs -RemoteName $Remote }
    Write-Host 'History rewrite complete.' -ForegroundColor Green
    Write-Host 'NOTE: Collaborators must re-clone or reset to the rewritten history.' -ForegroundColor DarkYellow
} catch {
    Write-Error $_
    exit 1
}


