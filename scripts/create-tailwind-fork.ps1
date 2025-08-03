# Create Tailwind Migration Fork
# Purpose: Creates a new GitHub fork for the tailwind-migration branch
# Parameters: None
# Examples: .\scripts\create-tailwind-fork.ps1
# Version: 1.0.0

param()

Write-Host "Creating Tailwind Migration Fork..." -ForegroundColor Green

# Check if we're on the correct branch
$currentBranch = git branch --show-current
if ($currentBranch -ne "tailwind-migration") {
    Write-Host "❌ Error: Not on tailwind-migration branch. Current branch: $currentBranch" -ForegroundColor Red
    Write-Host "Please run: git checkout tailwind-migration" -ForegroundColor Yellow
    exit 1
}

# Check if there are uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "Warning: You have uncommitted changes:" -ForegroundColor Yellow
    Write-Host $status -ForegroundColor Gray
    $response = Read-Host "Do you want to commit these changes before creating the fork? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        git add .
        $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
        if (-not $commitMessage) {
            $commitMessage = "feat: prepare for tailwind migration fork"
        }
        git commit -m $commitMessage
        Write-Host "✅ Changes committed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Please commit or stash your changes before creating the fork" -ForegroundColor Red
        exit 1
    }
}

# Push the branch to origin
Write-Host "Pushing tailwind-migration branch to origin..." -ForegroundColor Blue
git push -u origin tailwind-migration

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Branch pushed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://github.com/MD412/project-arceus" -ForegroundColor White
Write-Host "2. Click 'Fork' button to create your fork" -ForegroundColor White
Write-Host "3. Clone your fork locally" -ForegroundColor White
Write-Host "4. Switch to the tailwind-migration branch" -ForegroundColor White
Write-Host ""
Write-Host "The fork will be created with the tailwind-migration branch as the default" -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to push branch. Please check your git configuration." -ForegroundColor Red
    exit 1
} 