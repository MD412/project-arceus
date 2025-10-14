# Validate-JobProcessing.ps1 — Enqueue a scan via Supabase REST and poll until processed (ready/error)

<#
.SYNOPSIS
Validates end-to-end job processing by uploading an image to Supabase Storage, enqueuing a job via RPC, then polling tables until completion.

.DESCRIPTION
Uploads the provided image to the `scans` bucket at {UserId}/{ScanId}.jpg, calls `enqueue_scan_job`, then polls `scan_uploads` and `scans` to ensure the worker runs to completion. Outputs the final status and summary.

.PARAMETER SupabaseUrl
Base Supabase URL (e.g. https://xyzcompany.supabase.co)

.PARAMETER ServiceRoleKey
Supabase service role JWT for privileged REST calls (bypasses RLS). Keep secret.

.PARAMETER UserId
UUID of the user to associate with the upload (must exist in DB).

.PARAMETER ImagePath
Path to the local image file (.jpg/.jpeg/.png) to upload.

.PARAMETER PollIntervalSec
Seconds to wait between poll attempts (default: 5).

.PARAMETER TimeoutSec
Maximum seconds to wait before timing out (default: 600).

.EXAMPLE
./Validate-JobProcessing.ps1 -SupabaseUrl "https://YOUR.supabase.co" -ServiceRoleKey (Get-Content .\.secrets\service_key.txt) -UserId "00000000-0000-0000-0000-000000000000" -ImagePath "test-raw_scan_images\\IMG_4823.JPEG"

.NOTES
Version: 1.0.0
History:
- 1.0.0 Initial version

#>

[CmdletBinding()] Param(
    [Parameter(Mandatory=$true)] [string] $SupabaseUrl,
    [Parameter(Mandatory=$true)] [string] $ServiceRoleKey,
    [Parameter(Mandatory=$true)] [string] $UserId,
    [Parameter(Mandatory=$true)] [string] $ImagePath,
    [int] $PollIntervalSec = 5,
    [int] $TimeoutSec = 600
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $IsWindows) {
    Write-Warning "This script is intended for Windows PowerShell. Proceeding anyway."
}

if (-not (Test-Path -LiteralPath $ImagePath)) {
    throw "ImagePath not found: $ImagePath"
}

function New-ScanId {
    return [guid]::NewGuid().ToString()
}

function New-HttpClient {
    $handler = New-Object System.Net.Http.HttpClientHandler
    $client = [System.Net.Http.HttpClient]::new($handler)
    $client.Timeout = [TimeSpan]::FromSeconds(120)
    return $client
}

function Invoke-JsonPost {
    param(
        [Parameter(Mandatory=$true)] [System.Net.Http.HttpClient] $Client,
        [Parameter(Mandatory=$true)] [string] $Url,
        [Parameter(Mandatory=$true)] [hashtable] $Body,
        [Parameter(Mandatory=$true)] [string] $Bearer
    )
    $json = ($Body | ConvertTo-Json -Depth 6)
    $content = New-Object System.Net.Http.StringContent($json, [System.Text.Encoding]::UTF8, 'application/json')
    $request = New-Object System.Net.Http.HttpRequestMessage 'POST', $Url
    $request.Content = $content
    $request.Headers.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Bearer', $Bearer)
    $response = $Client.Send($request)
    $raw = $response.Content.ReadAsStringAsync().Result
    if (-not $response.IsSuccessStatusCode) {
        throw "POST $Url failed: $($response.StatusCode) $raw"
    }
    if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
    try { return $raw | ConvertFrom-Json } catch { return $raw }
}

function Invoke-RestGet {
    param(
        [Parameter(Mandatory=$true)] [System.Net.Http.HttpClient] $Client,
        [Parameter(Mandatory=$true)] [string] $Url,
        [Parameter(Mandatory=$true)] [string] $Bearer
    )
    $request = New-Object System.Net.Http.HttpRequestMessage 'GET', $Url
    $request.Headers.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Bearer', $Bearer)
    $response = $Client.Send($request)
    $raw = $response.Content.ReadAsStringAsync().Result
    if (-not $response.IsSuccessStatusCode) {
        throw "GET $Url failed: $($response.StatusCode) $raw"
    }
    if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
    try { return $raw | ConvertFrom-Json } catch { return $raw }
}

function Invoke-StorageUpload {
    param(
        [Parameter(Mandatory=$true)] [System.Net.Http.HttpClient] $Client,
        [Parameter(Mandatory=$true)] [string] $SupabaseUrl,
        [Parameter(Mandatory=$true)] [string] $Bearer,
        [Parameter(Mandatory=$true)] [string] $BucketName,
        [Parameter(Mandatory=$true)] [string] $ObjectPath,
        [Parameter(Mandatory=$true)] [string] $LocalPath
    )

    $bytes = [System.IO.File]::ReadAllBytes($LocalPath)
    $content = New-Object System.Net.Http.ByteArrayContent($bytes)
    # Guess content-type
    $ext = [System.IO.Path]::GetExtension($LocalPath).ToLowerInvariant()
    $contentType = switch ($ext) {
        '.jpeg' { 'image/jpeg' }
        '.jpg' { 'image/jpeg' }
        '.png' { 'image/png' }
        default { 'application/octet-stream' }
    }
    $content.Headers.ContentType = New-Object System.Net.Http.Headers.MediaTypeHeaderValue($contentType)

    $url = "$SupabaseUrl/storage/v1/object/$BucketName/$ObjectPath"
    $request = New-Object System.Net.Http.HttpRequestMessage 'POST', $url
    $request.Content = $content
    $request.Headers.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Bearer', $Bearer)
    $request.Headers.Add('x-upsert', 'true')

    $response = $Client.Send($request)
    $raw = $response.Content.ReadAsStringAsync().Result
    if (-not $response.IsSuccessStatusCode) {
        throw "UPLOAD $url failed: $($response.StatusCode) $raw"
    }
}

function Get-UrlEncoded {
    param([string] $Value)
    return [System.Web.HttpUtility]::UrlEncode($Value)
}

Write-Host "== Validate End-to-End Job Processing ==" -ForegroundColor Cyan
Write-Host "Supabase: $SupabaseUrl"
Write-Host "UserId:    $UserId"
Write-Host "Image:     $ImagePath"

$scanId = New-ScanId
$fileName = [System.IO.Path]::GetFileName($ImagePath)
if (-not $fileName.ToLower().EndsWith('.jpg') -and -not $fileName.ToLower().EndsWith('.jpeg') -and -not $fileName.ToLower().EndsWith('.png')) {
    Write-Warning "ImagePath should be a JPG/PNG; continuing"
}
$storagePath = "$UserId/$scanId.jpg"

$client = New-HttpClient

try {
    Write-Host "[1/4] Uploading file to storage: scans/$storagePath" -ForegroundColor Yellow
    Invoke-StorageUpload -Client $client -SupabaseUrl $SupabaseUrl -Bearer $ServiceRoleKey -BucketName 'scans' -ObjectPath $storagePath -LocalPath $ImagePath
    Write-Host "    OK" -ForegroundColor Green

    Write-Host "[2/4] Enqueuing job via RPC enqueue_scan_job" -ForegroundColor Yellow
    $rpcUrl = "$SupabaseUrl/rest/v1/rpc/enqueue_scan_job"
    $rpcBody = @{ p_scan_id = $scanId; p_user_id = $UserId; p_storage_path = $storagePath }
    $null = Invoke-JsonPost -Client $client -Url $rpcUrl -Body $rpcBody -Bearer $ServiceRoleKey
    Write-Host "    OK (scan_uploads id = $scanId)" -ForegroundColor Green

    Write-Host "[3/4] Polling status until completion (timeout ${TimeoutSec}s, every ${PollIntervalSec}s)" -ForegroundColor Yellow
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    $final = $null
    $scanRow = $null
    do {
        Start-Sleep -Seconds $PollIntervalSec

        # Check scan_uploads status
        $uploadsUrl = "$SupabaseUrl/rest/v1/scan_uploads?id=eq.$scanId&select=id,processing_status,error_message"
        $uploadRow = Invoke-RestGet -Client $client -Url $uploadsUrl -Bearer $ServiceRoleKey
        $uploadStatus = if ($uploadRow -and $uploadRow.Count -ge 1) { $uploadRow[0].processing_status } else { $null }

        # Try to resolve the created scan row by storage_path
        $encodedPath = Get-UrlEncoded $storagePath
        $scansUrl = "$SupabaseUrl/rest/v1/scans?storage_path=eq.$encodedPath&select=id,status,progress,summary_image_path&order=created_at.desc&limit=1"
        $scanRows = Invoke-RestGet -Client $client -Url $scansUrl -Bearer $ServiceRoleKey
        if ($scanRows -and $scanRows.Count -ge 1) { $scanRow = $scanRows[0] }

        $status = $null
        if ($scanRow) { $status = $scanRow.status }
        elseif ($uploadStatus) { $status = $uploadStatus }

        Write-Host ("    status: " + ($status ?? 'unknown'))

        if ($status -in @('ready','review_pending','completed')) {
            $final = 'success'
        } elseif ($status -in @('error','failed','timeout')) {
            $final = 'failure'
        }
    } while (-not $final -and (Get-Date) -lt $deadline)

    if (-not $final) {
        throw "Timed out waiting for job to complete."
    }

    Write-Host "[4/4] Fetching detections summary" -ForegroundColor Yellow
    $detectionsCount = 0
    if ($scanRow -and $scanRow.id) {
        $scanIdCreated = $scanRow.id
        $detsUrl = "$SupabaseUrl/rest/v1/card_detections?scan_id=eq.$scanIdCreated&select=id"
        $dets = Invoke-RestGet -Client $client -Url $detsUrl -Bearer $ServiceRoleKey
        if ($dets) { $detectionsCount = @($dets).Count }
    }

    Write-Host "== Result ==" -ForegroundColor Cyan
    Write-Host ("ScanUploadId:  " + $scanId)
    Write-Host ("StoragePath:   scans/" + $storagePath)
    if ($scanRow) {
        Write-Host ("ScanId:        " + $scanRow.id)
        Write-Host ("ScanStatus:    " + $scanRow.status)
        Write-Host ("Progress:      " + $scanRow.progress)
        if ($scanRow.summary_image_path) { Write-Host ("SummaryImage:  " + $scanRow.summary_image_path) }
    }
    Write-Host ("Detections:    " + $detectionsCount)

    # Timing diagnostics from job_queue
    try {
        $jobUrl = "$SupabaseUrl/rest/v1/job_queue?scan_upload_id=eq.$scanId&select=id,created_at,picked_at,started_at,completed_at,status&order=created_at.desc&limit=1"
        $jobRows = Invoke-RestGet -Client $client -Url $jobUrl -Bearer $ServiceRoleKey
        if ($jobRows -and $jobRows.Count -ge 1) {
            $job = $jobRows[0]
            $createdAt = if ($job.created_at) { [datetime]$job.created_at } else { $null }
            $pickedAt = if ($job.picked_at) { [datetime]$job.picked_at } else { $null }
            $startedAt = if ($job.started_at) { [datetime]$job.started_at } else { $null }
            $completedAt = if ($job.completed_at) { [datetime]$job.completed_at } else { $null }

            $queueRef = if ($startedAt) { $startedAt } elseif ($pickedAt) { $pickedAt } else { $null }
            $endRef = if ($completedAt) { $completedAt } else { Get-Date }

            $queueSeconds = if ($createdAt -and $queueRef) { [int](($queueRef - $createdAt).TotalSeconds) } else { $null }
            $runSeconds = if ($startedAt -and $completedAt) { [int](($completedAt - $startedAt).TotalSeconds) } else { $null }
            $totalSeconds = if ($createdAt -and $completedAt) { [int](($completedAt - $createdAt).TotalSeconds) } else { $null }

            Write-Host "-- Timing (job_queue) --" -ForegroundColor Cyan
            if ($totalSeconds -ne $null) { Write-Host ("total_s: " + $totalSeconds) }
            if ($queueSeconds -ne $null) { Write-Host ("queue_s: " + $queueSeconds) }
            if ($runSeconds -ne $null) { Write-Host ("run_s:   " + $runSeconds) }
        }
    } catch {
        Write-Warning "Timing diagnostics failed: $($_.Exception.Message)"
    }

    if ($final -eq 'success') {
        Write-Host "SUCCESS: Job processed end-to-end." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "FAILURE: Job ended in failure state." -ForegroundColor Red
        exit 2
    }

} catch {
    Write-Error $_
    exit 1
} finally {
    if ($client) { $client.Dispose() }
}


