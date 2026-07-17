@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM  Password Manager - full startup script
REM  Starts Docker Desktop (if needed), waits for the daemon,
REM  builds and launches all services via docker compose.
REM ============================================================

cd /d "%~dp0"

echo(
echo ============================================
echo   Password Manager - Starting Application
echo ============================================
echo(

REM --- Check if Docker CLI is available ---
where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH.
    echo Please install Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM --- Check if the Docker daemon is running; start Docker Desktop if not ---
docker info >nul 2>&1
if errorlevel 1 (
    echo [INFO] Docker daemon not running. Launching Docker Desktop...
    if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
        start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    ) else (
        echo [ERROR] Could not find "Docker Desktop.exe" in "%ProgramFiles%\Docker\Docker\".
        echo Please start Docker Desktop manually and re-run this script.
        pause
        exit /b 1
    )

    echo [INFO] Waiting for Docker daemon to become ready...
    set /a "attempts=0"
    :waitloop
    set /a "attempts+=1"
    docker info >nul 2>&1
    if not errorlevel 1 goto ready
    if !attempts! geq 60 (
        echo(
        echo [ERROR] Docker daemon did not start within the timeout.
        echo Please ensure Docker Desktop is running, then re-run this script.
        pause
        exit /b 1
    )
    <nul set /p "=."
    timeout /t 5 /nobreak >nul
    goto waitloop
    :ready
    echo(
    echo [INFO] Docker daemon is ready.
) else (
    echo [INFO] Docker daemon is already running.
)

echo(
echo [INFO] Building and starting services...
echo(

docker compose up --build -d
if errorlevel 1 (
    echo(
    echo [ERROR] Failed to start services. See the output above for details.
    pause
    exit /b 1
)

echo(
echo [INFO] Service status:
docker compose ps

echo(
echo ============================================
echo   Application is running!
echo(
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo ============================================
echo(

REM --- Open the app in the default browser ---
start "" "http://localhost:3000"

echo To view logs : docker compose logs -f
echo To stop      : docker compose down  (or run stop.bat)
echo(
pause
