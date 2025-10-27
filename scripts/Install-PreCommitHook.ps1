<#
.SYNOPSIS
Installs a pre-commit git hook that runs the Check-PreCommitSecrets.ps1 guard.

.DESCRIPTION
Writes a Windows-compatible pre-commit hook into .git/hooks that invokes PowerShell 7
and executes scripts/Check-PreCommitSecrets.ps1. Overwrites existing hook after backup.

.EXAMPLE
./scripts/Install-PreCommitHook.ps1

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

try {
    Assert-Windows
    Assert-GitPresent
    $repoRoot = Get-RepoRoot
    Set-Location $repoRoot

    $hooksDir = Join-Path $repoRoot '.git/hooks'
    if (-not (Test-Path $hooksDir)) { New-Item -ItemType Directory -Path $hooksDir | Out-Null }

    $hookPath = Join-Path $hooksDir 'pre-commit'
    if (Test-Path $hookPath) {
        Copy-Item $hookPath "$hookPath.bak" -Force
    }

    $scriptRel = 'scripts/Check-PreCommitSecrets.ps1'
    $hookContent = @("#!/usr/bin/env pwsh","pwsh -NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$scriptRel`"") -join "`n"
    Set-Content -Path $hookPath -Value $hookContent -NoNewline

    Write-Host "Installed pre-commit hook -> $hookPath" -ForegroundColor Green
    Write-Host "Verify: git commit will now run $scriptRel" -ForegroundColor Yellow
} catch {
    Write-Error $_
    exit 1
}


