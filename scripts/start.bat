@echo off
cd /d "%~dp0backend"
echo Starting Rabins Video Player...
start python run.py
timeout /t 4 /nobreak > nul
start http://localhost:8000
echo.
echo Rabins Video Player is running at http://localhost:8000
echo Close this window to stop the server.
echo.
pause
taskkill /F /FI "WINDOWTITLE eq python*run*" > nul 2>&1
