@echo off
rem ------------------------------------------------------------
rem  KrishiBundle - One-click local launcher
rem  Starts both frontend (Next.js) and backend (FastAPI),
rem  then opens Chrome to http://localhost:3000
rem ------------------------------------------------------------

:: Change to the repo root (where this script lives)
pushd "%~dp0"

:: ---------- Frontend (Next.js) ----------
pushd frontend
echo [1/3] Installing frontend dependencies...
call npm.cmd install
echo [2/3] Starting Next.js dev server...
start "KrishiBundle Frontend" cmd /c "npm.cmd run dev"
popd

:: ---------- Backend (FastAPI) ----------
pushd backend
echo [3/3] Starting FastAPI backend...
start "KrishiBundle Backend" cmd /c "uvicorn main:app --reload"
popd

popd

:: Wait for the servers to boot
echo.
echo Waiting for servers to start...
timeout /t 6 /nobreak >nul

:: Open Chrome
echo Opening Chrome at http://localhost:3000 ...
start "" "http://localhost:3000"

echo.
echo ============================================
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000/docs
echo   Press Ctrl+C in each window to stop.
echo ============================================
