@echo off
echo Starting PhytoMonitor Backend Server (Port 5000)...
start cmd /k "cd backend && npm start"

echo Starting PhytoMonitor Frontend Server (Port 5173)...
start cmd /k "cd frontend && npm run dev"

echo Waiting 5 seconds for frontend to start before creating global tunnel...
timeout /t 5 /nobreak >nul

echo =========================================================
echo Creating Global Internet Tunnel to your App!
echo =========================================================
echo When Localtunnel gives you the "your url is..." link below:
echo 1. Open that link anywhere (e.g. your phone's mobile network).
echo 2. Your app is now globally accessible!
echo.
echo NOTE: If the browser asks for a password, your tunnel password is your public IP.
npx -y localtunnel --port 5173
