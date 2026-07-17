@echo off
REM ============================================================
REM  Password Manager - stop script
REM  Stops and removes all running containers.
REM ============================================================

cd /d "%~dp0"

echo(
echo [INFO] Stopping Password Manager services...
docker compose down

echo(
echo [INFO] All services stopped.
pause
