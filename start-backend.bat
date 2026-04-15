@echo off
setlocal

cd /d "%~dp0"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  echo Backend is already running on port 3000.
  goto :end
)

echo Starting backend (npm run dev)...
start "resume-optimizer-backend" cmd /k "cd /d "%~dp0" && npm run dev"

:end
endlocal
