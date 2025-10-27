<#
.SYNOPSIS
Prevents accidental commits of .cursor/mcp.json by untracking and optionally marking skip-worktree.

.DESCRIPTION
Untracks `.cursor/mcp.json` from git and can mark it with skip-worktree so local changes are ignored.
Includes checks for Windows/PowerShell, git presence, and repository root.

.PARAMETER SkipWorktree
If set, marks .cursor/mcp.json with skip-worktree. Default is to only untrack.

.EXAMPLE
# Untrack only
./scripts/Protect-CursorMcpFile.ps1

.EXAMPLE
# Untrack and mark skip-worktree
./scripts/Protect-CursorMcpFile.ps1 -SkipWorktree

.NOTES
Version: 1.1.0
History:
- 1.1.0 (2025-10-25): Target .cursor/mcp.json and improve .gitignore handling
- 1.0.0 (2025-10-25): Initial version
#>

param(
    [switch]$SkipWorktree
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

function Get-RepoRoot {
    $root = (git rev-parse --show-toplevel) 2>$null
    if (-not $root) {
        throw 'Not inside a git repository.'
    }
    return $root
}

function Ensure-InRepoRoot {
    param(
        [string]$RepoRoot
    )
    Set-Location $RepoRoot
}

function Ensure-Ignored {
    param(
        [string]$RepoRoot
    )
    $gitignorePath = Join-Path $RepoRoot '.gitignore'
    $dirEntry = '.cursor/'
    $fileEntry = '.cursor/mcp.json'
    if (-not (Test-Path $gitignorePath)) {
        throw ".gitignore not found at $RepoRoot"
    }
    $content = Get-Content $gitignorePath -Raw
    $hasDir = $content -match "(?m)^$([regex]::Escape($dirEntry))$"
    $hasFile = $content -match "(?m)^$([regex]::Escape($fileEntry))$"
    if (-not $hasDir -and -not $hasFile) {
        Add-Content -Path $gitignorePath -Value $fileEntry
        Write-Host "Added '$fileEntry' to .gitignore" -ForegroundColor Yellow
    }
}

function Untrack-File {
    param(
        [string]$RepoRoot
    )
    $target = Join-Path $RepoRoot '.cursor/mcp.json'
    if (Test-Path $target) {
        git update-index --assume-unchanged -- '.cursor/mcp.json' 2>$null | Out-Null
        git rm --cached --ignore-unmatch -- '.cursor/mcp.json' | Out-Null
        Write-Host 'Untracked .cursor/mcp.json from git index.' -ForegroundColor Green
    } else {
        Write-Host '.cursor/mcp.json does not exist yet. Proceeding with protections.' -ForegroundColor Yellow
    }
}

function Set-SkipWorktreeIfRequested {
    param(
        [bool]$Enable
    )
    if ($Enable) {
        git update-index --skip-worktree -- '.cursor/mcp.json' 2>$null | Out-Null
        Write-Host 'Marked .cursor/mcp.json as skip-worktree.' -ForegroundColor Green
    } else {
        Write-Host 'Skip-worktree not requested. Only untracked the file.' -ForegroundColor Gray
    }
}

try {
    Assert-Windows
    Assert-GitPresent
    $repoRoot = Get-RepoRoot
    Ensure-InRepoRoot -RepoRoot $repoRoot
    Ensure-Ignored -RepoRoot $repoRoot
    Untrack-File -RepoRoot $repoRoot
    Set-SkipWorktreeIfRequested -Enable:$SkipWorktree.IsPresent
    Write-Host 'Protection complete.' -ForegroundColor Cyan
    Write-Host 'Note: If the file was previously committed, create a commit to remove it from history if needed.' -ForegroundColor DarkYellow
} catch {
    Write-Error $_
    exit 1
}
