@echo off
setlocal
echo ======================================================
echo PREPARANDO BUILD DE DESARROLLO - ARENA FIGHT PASS
echo ======================================================
echo.
echo Este script iniciara el proceso de compilacion en la nube de Expo.
echo Necesitaras tu cuenta de Expo (correo y contraseña).
echo.

cd mobile

echo [1/3] Iniciando sesion en Expo...
call npx eas-cli login

if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudo iniciar sesion. Por favor verifica tus credenciales.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Verificando configuracion del proyecto...
call npx eas-cli build:configure

echo.
echo [3/3] Lanzando compilacion para Android (Development Build)...
echo Esto puede tardar varios minutos en los servidores de Expo.
echo Al finalizar, recibiras un enlace para descargar el APK.
echo.
call npx eas-cli build --profile development --platform android

echo.
echo Una vez descargado e instalado el APK en tu telefono:
echo Ejecuta "npx expo start --dev-client" en la terminal para empezar a desarrollar.
echo.
pause
