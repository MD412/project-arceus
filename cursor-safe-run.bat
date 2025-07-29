@echo off
REM Cursor-safe command wrapper for Windows CMD
REM Prevents tool calls from hanging by ensuring clean exit signals

if "%~1"=="" (
    echo Usage: cursor-safe-run.bat ^<command^> [arguments...]
    echo Example: cursor-safe-run.bat pytest -q __tests__/ocr/test_ocr_pipeline.py
    exit /b 1
)

echo Executing: %*
echo.

REM Execute the command
call %*
set EXIT_CODE=%ERRORLEVEL%

REM Force clean exit signal
echo.
echo __CURSOR_DONE__
echo Exit code: %EXIT_CODE%

exit /b %EXIT_CODE% 