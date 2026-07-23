@echo off
title AI Career Companion - Launcher
color 0A

echo ============================================
echo   AI Career Companion - Starting Services
echo ============================================
echo.

:: ── 1. Start Python FastAPI backend in a new window ─────────────────────────
echo [1/2] Starting Python backend on port 8001...
start "Python Backend (port 8001)" cmd /k "cd /d "%~dp0python-backend" && echo Starting FastAPI server... && "%~dp0python-backend\venv-chatbot\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

:: Give the backend a moment to initialise before the browser opens
timeout /t 3 /nobreak >nul

:: ── 2. Start Next.js frontend in a new window ────────────────────────────────
echo [2/2] Starting Next.js frontend on port 3000...
start "Next.js Frontend (port 3000)" cmd /k "cd /d "%~dp0" && echo Starting Next.js dev server... && npm run dev"

echo.
echo ============================================
echo   Both services are starting up!
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8001
echo   Health   : http://localhost:8001/health
echo ============================================
echo.
echo You can close this window. The two service
echo windows will keep running independently.
echo.
pause
