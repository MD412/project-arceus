@echo off
echo 🚀 Starting Project Arceus Worker via GitBash...

REM Check if Git Bash is available
where bash >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ GitBash not found in PATH. Please install Git for Windows.
    pause
    exit /b 1
)

REM Run the worker script through GitBash
bash .cursor/run-worker.sh

pause 