# Activate the correct virtual environment first
. .\\.venv-gpu\\Scripts\\Activate.ps1

Write-Host "🚀 Starting Project Arceus Worker..." -ForegroundColor Cyan
# The script is run from the project root, so we don't need to change directory
py worker/worker.py 