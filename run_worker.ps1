# Run the worker locally against production database
# This is useful for testing worker changes without redeploying to Render

Write-Host "Starting Project Arceus Worker (Local)" -ForegroundColor Green
Write-Host "Connecting to production database..." -ForegroundColor Yellow

# Check if we're in the right directory
if (-not (Test-Path "worker/worker.py")) {
    Write-Host "Error: Must run from project root directory" -ForegroundColor Red
    exit 1
}

# Check if Python venv exists (prefer .venv-gpu, fallback to .venv)
$venvPath = if (Test-Path ".venv-gpu") { ".venv-gpu" } elseif (Test-Path ".venv") { ".venv" } else { $null }

if (-not $venvPath) {
    Write-Host "No venv found. Creating .venv..." -ForegroundColor Yellow
    python -m venv .venv
    $venvPath = ".venv"
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    & "$venvPath/Scripts/python.exe" -m pip install -r worker/requirements.txt
} else {
    Write-Host "Using existing venv: $venvPath" -ForegroundColor Cyan
}

# Activate venv and run worker
Write-Host "Starting worker process..." -ForegroundColor Green
& "$venvPath/Scripts/python.exe" worker/worker.py

Write-Host "Worker stopped." -ForegroundColor Yellow

