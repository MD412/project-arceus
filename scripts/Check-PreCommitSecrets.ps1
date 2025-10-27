<#
.SYNOPSIS
Pre-commit guard to prevent committing sensitive client config (e.g., .cursor/mcp.json).

.DESCRIPTION
Aborts the commit if `.cursor/mcp.json` or `cursor.mcp.json` is staged.
Includes checks for Windows/PowerShell, git presence, and repository root context.

.EXAMPLE
# Used by .git/hooks/pre-commit
./scripts/Check-PreCommitSecrets.ps1

.NOTES
Version: 1.0.0
History:
- 1.0.0 (2025-10-26): Initial version
#>

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
    if (-not $root) { throw 'Not inside a git repository.' }
    return $root
}

function Get-StagedFiles {
    $raw = git diff --cached --name-only -z 2>$null
    if (-not $raw) { return @() }
    return $raw -split '\x00' | Where-Object { $_ -ne '' }
}

try {
    Assert-Windows
    Assert-GitPresent
    $repoRoot = Get-RepoRoot
    Set-Location $repoRoot

    $staged = Get-StagedFiles
    if (-not $staged -or $staged.Count -eq 0) { exit 0 }

    $blocked = $staged | Where-Object { $_ -ieq '.cursor/mcp.json' -or $_ -ieq 'cursor.mcp.json' }
    if ($blocked) {
        Write-Host "Commit blocked: sensitive file staged -> $($blocked -join ', ')" -ForegroundColor Red
        Write-Host "Action: Unstage it (git restore --staged .cursor/mcp.json) and run scripts/Protect-CursorMcpFile.ps1 -SkipWorktree" -ForegroundColor Yellow
        exit 1
    }

    exit 0
} catch {
    Write-Error $_
    exit 1
}


