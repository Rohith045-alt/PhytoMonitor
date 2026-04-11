@echo off
echo Starting PhytoMonitor Backend Server...
start cmd /k "cd backend && npm start"

echo Starting PhytoMonitor Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo Both servers are starting up in separate windows!
echo Once the Vite frontend starts, look for the "Network" URL to access it on your phone.
