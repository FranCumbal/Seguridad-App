@echo off
chcp 65001 >nul
echo ============================================================
echo   PROMPT MAESTRO — Setup Automatizado
echo ============================================================
echo.

node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado. Descargalo desde nodejs.org
    pause & exit /b 1
)
echo [OK] Node.js detectado

echo.
echo [1/5] Instalando dependencias del frontend...
call npm install
if %ERRORLEVEL% NEQ 0 ( echo [ERROR] Fallo frontend & pause & exit /b 1 )

echo.
echo [2/5] Instalando dependencias del servidor...
cd server
call npm install
if %ERRORLEVEL% NEQ 0 ( echo [ERROR] Fallo servidor & pause & exit /b 1 )

echo.
echo [3/5] Copiando archivos .env...
cd ..
if not exist ".env" ( copy .env.example .env & echo [OK] .env creado )
if not exist "server\.env" ( copy server\.env.example server\.env & echo [OK] server\.env creado )

echo.
echo [4/5] Generando cliente Prisma...
cd server
call .\node_modules\.bin\prisma generate
if %ERRORLEVEL% NEQ 0 ( echo [WARN] Prisma generate fallo - verifica DATABASE_URL en server\.env )

echo.
echo ============================================================
echo   SETUP COMPLETADO
echo ============================================================
echo.
echo SIGUIENTES PASOS MANUALES:
echo.
echo   1. Edita server\.env con tu conexion a SQL Server:
echo      DATABASE_URL="sqlserver://localhost;instance=SQLEXPRESS;
echo               database=PromptMaestro;integratedSecurity=true;
echo               encrypt=true;trustServerCertificate=true"
echo.
echo   2. Crea la base de datos en SSMS:
echo      CREATE DATABASE PromptMaestro;
echo.
echo   3. Ejecuta desde la carpeta server\:
echo      .\node_modules\.bin\prisma db push
echo      npm run db:seed
echo.
echo   4. Inicia la app:
echo      npm run dev:full   (desde la raiz del proyecto)
echo.
echo Credenciales: admin / Admin123!
echo.
cd ..
pause
