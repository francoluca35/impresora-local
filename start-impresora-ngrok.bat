@echo off
title Servidor de impresión + Ngrok
cd C:\Users\Administrator\impresora-local

:: Inicia index.js con Node.js
start "Servidor de Impresión" cmd /k node index.js

:: Espera 5 segundos y luego lanza ngrok
timeout /t 5 /nobreak > NUL
start "Ngrok" cmd /k C:\Users\Administrator\ngrok\ngrok.exe http --url=right-worthy-collie.ngrok-free.app 4000

echo Servidor de impresión y ngrok iniciados correctamente
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
