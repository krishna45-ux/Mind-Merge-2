@echo off
echo ====================================
echo   MindMerge AI - Development Server
echo ====================================
echo.

echo Checking/Installing dependencies...
call npm install

echo.
echo Starting API server (port 3001)...
start "MindMerge API" cmd /c "npx tsx watch server/api.ts"

echo Starting frontend dev server (port 3000)...
echo.
echo   Frontend:  http://localhost:3000
echo   API:       http://localhost:3001/api/health
echo.
call npx vite --port=3000 --host=0.0.0.0

pause
