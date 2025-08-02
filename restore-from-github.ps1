# Restore from GitHub fork
Write-Host "=== Restoring from GitHub fork ===" -ForegroundColor Green

# Backup current directory name
$currentDir = Split-Path -Leaf (Get-Location)
$backupDir = "$currentDir-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "Creating backup of current directory as: $backupDir" -ForegroundColor Yellow
Rename-Item -Path "." -NewName $backupDir

Write-Host "Cloning fresh copy from GitHub..." -ForegroundColor Yellow
git clone https://github.com/MD412/project-arceus.git .

Write-Host "Switching to scan-review-redesign branch..." -ForegroundColor Yellow
git checkout scan-review-redesign

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "=== Restore Complete ===" -ForegroundColor Green
Write-Host "Your codebase is now restored from GitHub!" -ForegroundColor Green 