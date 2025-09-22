<#
.SYNOPSIS
Seeds a mock review scan via local API for E2E tests (creates detections).

.DESCRIPTION
Generates or accepts a ScanId and POSTs to /api/scans/{id}/mock on the running app.

.PARAMETER ScanId
Optional GUID for the scan. If omitted, a new GUID is generated.

.PARAMETER BaseUrl
Base URL of the running app. Defaults to http://localhost:3000

.EXAMPLE
./scripts/Seed-MockReviewScan.ps1

.EXAMPLE
./scripts/Seed-MockReviewScan.ps1 -ScanId 11111111-1111-1111-1111-111111111111

.NOTES
Version: 1.0.0
#>

param(
  [Parameter(Mandatory=$false)]
  [string]$ScanId,

  [Parameter(Mandatory=$false)]
  [string]$BaseUrl = 'http://localhost:3000'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $ScanId -or $ScanId -eq '') {
  $ScanId = [guid]::NewGuid().Guid
}

Write-Host "Seeding mock review scan: $ScanId" -ForegroundColor Cyan
$uri = "$BaseUrl/api/scans/$ScanId/mock"

try {
  $response = Invoke-RestMethod -Method POST -Uri $uri -ContentType 'application/json'
  $json = $response | ConvertTo-Json -Depth 6
  Write-Host "Seeded mock scan." -ForegroundColor Green
  Write-Host $json
} catch {
  Write-Error "Failed to seed mock scan at $uri. $_"
  exit 1
}

Write-Host "ScanId=$ScanId" -ForegroundColor Yellow

