@echo off
echo Iniciando Seguridad App en modo desarrollo...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:1420
echo.
start "SA Backend" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul
start "PM Tauri" cmd /k "npm run tauri:dev"
