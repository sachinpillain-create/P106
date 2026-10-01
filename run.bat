@echo off
setlocal enabledelayedexpansion
title SIH26106 - Forensic Intelligence Workbench

echo ======================================================================
echo    SIH26106 -- Forensic Intelligence Workbench (Hybrid CPU/GPU)
echo ======================================================================
echo.

cd /d "%~dp0"

REM Activate virtual environment if present
if exist "venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment...
    call "venv\Scripts\activate.bat"
)

REM Determine python executable (prefer venv python if present)
set "PYTHON_CMD=python"
if exist "venv\Scripts\python.exe" (
    set "PYTHON_CMD=%~dp0venv\Scripts\python.exe"
)

REM Check if python is available
"%PYTHON_CMD%" --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Python was not found or is not working.
    echo Please make sure Python or the venv virtual environment is installed.
    echo.
    pause
    exit /b 1
)

REM Check if baseline model exists, if not train it
if not exist "models\baseline_tfidf.joblib" (
    echo [INFO] Training baseline ML model...
    "%PYTHON_CMD%" -m backend.ml.train_baseline --data data\sample_dataset.csv
    echo.
)

echo [INFO] Starting server on http://localhost:8000 ...
echo [INFO] Dashboard URL: http://localhost:8000/app/
echo [INFO] API Docs URL : http://localhost:8000/docs
echo.
echo Press Ctrl+C in this window to stop the server.
echo ======================================================================
echo.

REM Automatically launch browser after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8000/app/"

REM Run Uvicorn server
"%PYTHON_CMD%" -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server terminated with an error.
    pause
)
