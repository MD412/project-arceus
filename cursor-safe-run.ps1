# Cursor-safe command wrapper for Windows PowerShell
# Prevents tool calls from hanging by ensuring clean exit signals

param(
    [Parameter(Mandatory=$false)]
    [string]$Command = "",
    
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

# If no command provided, show usage
if (-not $Command) {
    Write-Host "Usage: .\cursor-safe-run.ps1 <command> [arguments...]"
    Write-Host "Example: .\cursor-safe-run.ps1 pytest -q __tests__/ocr/test_ocr_pipeline.py"
    exit 1
}

# Execute the command
try {
    Write-Host "Executing: $Command $($Arguments -join ' ')" -ForegroundColor Cyan
    
    # Build the command string
    $fullCommand = if ($Arguments) {
        "& $Command $($Arguments -join ' ')"
    } else {
        "& $Command"
    }
    
    # Execute and capture exit code
    Invoke-Expression $fullCommand
    $exitCode = $LASTEXITCODE
    
    # Force clean exit signal
    Write-Host "`n__CURSOR_DONE__" -ForegroundColor Green
    Write-Host "Exit code: $exitCode" -ForegroundColor Yellow
    
    exit $exitCode
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "`n__CURSOR_ERROR__" -ForegroundColor Red
    exit 1
} 