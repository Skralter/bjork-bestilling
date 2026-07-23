@echo off
setlocal

cd /d "%~dp0"

echo Stopper eventuell server paa port 3000...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  taskkill /PID %%p /F >nul 2>&1
)

echo Starter serveren paa nytt...
start "Bjoerk Bestilling Server" cmd /k "cd /d ""%~dp0"" && npm.cmd run dev"

echo Ferdig. Du kan lukke dette vinduet.
exit /b 0
