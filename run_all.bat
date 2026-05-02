@echo off
SETLOCAL EnableDelayedExpansion

:: Clear screen and show header
cls
echo ============================================================
echo           SEVA MARG - ONE-CLICK SERVER LAUNCHER
echo ============================================================
echo.
echo This script will start the Backend, User Side, and Admin Side
echo in three separate terminal windows.
echo.
echo [1/3] Starting Backend Server (Port 8000)...
start "Seva Marg - Backend" cmd /k "cd backend && echo Activating Virtual Environment... && .\venv\Scripts\activate && echo Starting Django Server... && python manage.py runserver"

echo [2/3] Starting User Frontend (Port 5173)...
start "Seva Marg - User Portal" cmd /k "cd user && echo Starting User Vite Server... && npm run dev"

echo [3/3] Starting Admin Frontend (Port 5174)...
start "Seva Marg - Admin Portal" cmd /k "cd admin && echo Starting Admin Vite Server... && npm run dev"

echo.
echo ------------------------------------------------------------
echo ✅ ALL SERVERS ARE LAUNCHING!
echo.
echo Access the portals here:
echo - User Portal:  http://localhost:5173
echo - Admin Portal: http://localhost:5174
echo - Backend API:  http://localhost:8000/api/
echo ------------------------------------------------------------
echo.
echo Keep the new windows open while working. 
echo You can close this window now.
pause
