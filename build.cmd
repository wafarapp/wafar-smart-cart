@echo off
REM Windows build helper — run from project root (no PowerShell && needed)
cd /d "%~dp0"
call npm.cmd run build
exit /b %ERRORLEVEL%
