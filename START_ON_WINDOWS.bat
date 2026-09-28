@echo off
title Amir Task Manager
cd /d "%~dp0"
echo Starting Amir Task Manager...
echo.
where py >nul 2>nul
if %errorlevel%==0 (
    start "" http://localhost:8080
    py -m http.server 8080
    exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
    start "" http://localhost:8080
    python -m http.server 8080
    exit /b
)
echo Python was not found on this PC.
echo Open README.txt for setup instructions.
pause
