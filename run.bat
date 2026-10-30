@echo off
title US Phone Number Validation Platform Launcher
echo ========================================================
echo   US Phone Number Validation Platform (1M Scale Engine)
echo ========================================================
echo.

cd /d "%~dp0backend"
echo [1/2] Starting Production Backend Server on http://localhost:8000 ...
start "" http://localhost:8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
