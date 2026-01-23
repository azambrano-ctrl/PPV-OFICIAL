@echo off
echo ========================================
echo   Instalando Dependencias del Backend
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

echo [2/3] Instalando dependencias (esto puede tomar 1-2 minutos)...
call npm install

if errorlevel 1 (
    echo.
    echo ERROR: Fallo la instalacion de dependencias
    pause
    exit /b 1
)

echo.
echo [3/3] Dependencias instaladas exitosamente!
echo.
echo ========================================
echo   Siguiente paso: Configurar .env
echo ========================================
echo.
echo 1. Copia .env.example a .env
echo 2. Edita .env con tus credenciales
echo 3. Ejecuta: npm run dev
echo.
pause
