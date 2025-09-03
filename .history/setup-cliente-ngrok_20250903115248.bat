@echo off
REM Script de configuración inicial para impresora-local con ngrok
REM Se ejecuta UNA SOLA VEZ en la PC del cliente

REM Configuración
set REPO_URL=https://github.com/francoluca35/impresora-local.git
set INSTALL_DIR=C:\Users\Administrator\impresora-local
set SERVICE_NAME=impresora-local

REM Colores para output (Windows 10+)
color 0A

echo [PASO] Iniciando configuración de impresora-local con ngrok...
echo.

REM Verificar si se ejecuta como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Este script debe ejecutarse como administrador
    echo Ejecuta el CMD como administrador y vuelve a intentar
    pause
    exit /b 1
)

REM Crear directorio de instalación
echo [INFO] Creando directorio de instalación...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Verificar si Git está instalado
echo [INFO] Verificando Git...
git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Git no está instalado
    echo Por favor instala Git desde: https://git-scm.com/download/win
    echo Después de instalar Git, ejecuta este script nuevamente
    pause
    exit /b 1
) else (
    echo [INFO] Git ya está instalado
)

REM Verificar si Node.js está instalado
echo [INFO] Verificando Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js no está instalado
    echo Por favor instala Node.js desde: https://nodejs.org/
    echo Después de instalar Node.js, ejecuta este script nuevamente
    pause
    exit /b 1
) else (
    echo [INFO] Node.js ya está instalado
)

REM Verificar si ngrok está instalado
echo [INFO] Verificando ngrok...
if not exist "C:\Users\Administrator\ngrok\ngrok.exe" (
    echo [WARN] ngrok no encontrado en C:\Users\Administrator\ngrok\ngrok.exe
    echo El script funcionará pero sin ngrok
) else (
    echo [INFO] ngrok encontrado
)

REM Clonar repositorio
echo [INFO] Clonando repositorio desde GitHub...
cd /d "%INSTALL_DIR%"
if exist "impresora-local" (
    echo [WARN] El directorio ya existe, actualizando...
    cd impresora-local
    git pull origin main
) else (
    git clone "%REPO_URL%" impresora-local
    cd impresora-local
)

REM Instalar dependencias de Node.js
echo [INFO] Instalando dependencias de Node.js...
npm install

REM Crear archivo de inicio con ngrok
echo [INFO] Creando archivo de inicio con ngrok...
echo @echo off > "%INSTALL_DIR%\start-impresora-ngrok.bat"
echo title Servidor de impresión + Ngrok >> "%INSTALL_DIR%\start-impresora-ngrok.bat"
echo cd C:\Users\Administrator\impresora-local >> "%INSTALL_DIR%\start-impresora-ngrok.bat"
echo. >> "%INSTALL_DIR%\start-impresora-ngrok.bat"
echo :: Inicia index.js con Node.js >> "%INSTALL_DIR%\start-impresora-ngrok.bat"
echo start "Servidor de Impresión" cmd /k node index.js >> "%INSTALL_DIR%\start-impresora-ngrok.bat"
echo. >> "%INSTALL_DIR%\start-impresora-ngrok.bat"
echo :: Espera 5 segundos y luego lanza ngrok >> "%INSTALL_DIR%\start-impresora-ngrok.bat"
echo timeout /t 5 /nobreak ^> NUL >> "%INSTALL_DIR%\start-impresora-ngrok.bat"
echo start "Ngrok" cmd /k C:\Users\Administrator\ngrok\ngrok.exe http --url=right-worthy-collie.ngrok-free.app 4000 >> "%INSTALL_DIR%\start-impresora-ngrok.bat"
echo. >> "%INSTALL_DIR%\start-impresora-ngrok.bat"
echo echo Servidor de impresión y ngrok iniciados correctamente >> "%INSTALL_DIR%\start-impresora-ngrok.bat"
echo echo. >> "%INSTALL_DIR%\start-impresora-ngrok.bat"
echo echo Presiona cualquier tecla para cerrar esta ventana... >> "%INSTALL_DIR%\start-impresora-ngrok.bat"
echo pause ^>nul >> "%INSTALL_DIR%\start-impresora-ngrok.bat"

REM Crear archivo de parada del servicio
echo @echo off > "%INSTALL_DIR%\stop-impresora.bat"
echo taskkill /f /im node.exe >> "%INSTALL_DIR%\stop-impresora.bat"
echo taskkill /f /im ngrok.exe >> "%INSTALL_DIR%\stop-impresora.bat"
echo echo Servicios detenidos >> "%INSTALL_DIR%\stop-impresora.bat"
echo pause >> "%INSTALL_DIR%\stop-impresora.bat"

REM Crear archivo de reinicio del servicio
echo @echo off > "%INSTALL_DIR%\restart-impresora.bat"
echo echo Deteniendo servicios... >> "%INSTALL_DIR%\restart-impresora.bat"
echo taskkill /f /im node.exe >> "%INSTALL_DIR%\restart-impresora.bat"
echo taskkill /f /im ngrok.exe >> "%INSTALL_DIR%\restart-impresora.bat"
echo timeout /t 2 /nobreak ^> NUL >> "%INSTALL_DIR%\restart-impresora.bat"
echo echo Reiniciando servicios... >> "%INSTALL_DIR%\restart-impresora.bat"
echo call "%INSTALL_DIR%\start-impresora-ngrok.bat" >> "%INSTALL_DIR%\restart-impresora.bat"

REM Crear archivo de estado del servicio
echo @echo off > "%INSTALL_DIR%\status-impresora.bat"
echo echo Estado de los servicios: >> "%INSTALL_DIR%\status-impresora.bat"
echo echo. >> "%INSTALL_DIR%\status-impresora.bat"
echo tasklist /fi "imagename eq node.exe" >> "%INSTALL_DIR%\status-impresora.bat"
echo echo. >> "%INSTALL_DIR%\status-impresora.bat"
echo tasklist /fi "imagename eq ngrok.exe" >> "%INSTALL_DIR%\status-impresora.bat"
echo echo. >> "%INSTALL_DIR%\status-impresora.bat"
echo echo Presiona cualquier tecla para continuar... >> "%INSTALL_DIR%\status-impresora.bat"
echo pause ^>nul >> "%INSTALL_DIR%\status-impresora.bat"

REM Crear archivo de logs de actualización
echo @echo off > "%INSTALL_DIR%\logs-update.bat"
echo if exist "%INSTALL_DIR%\impresora-local\update.log" ( >> "%INSTALL_DIR%\logs-update.bat"
echo     type "%INSTALL_DIR%\impresora-local\update.log" >> "%INSTALL_DIR%\logs-update.bat"
echo ) else ( >> "%INSTALL_DIR%\logs-update.bat"
echo     echo No hay logs de actualización disponibles >> "%INSTALL_DIR%\logs-update.bat"
echo ) >> "%INSTALL_DIR%\logs-update.bat"
echo echo. >> "%INSTALL_DIR%\logs-update.bat"
echo echo Presiona cualquier tecla para continuar... >> "%INSTALL_DIR%\logs-update.bat"
echo pause ^>nul >> "%INSTALL_DIR%\logs-update.bat"

REM Crear tarea programada para auto-actualización
echo [INFO] Creando tarea programada para auto-actualización...
schtasks /create /tn "ImpresoraLocal-AutoUpdate" /tr "%INSTALL_DIR%\impresora-local\auto-update.bat" /sc minute /mo 5 /ru "Administrator" /f

REM Mostrar información final
echo.
echo [PASO] Configuración completada!
echo.
echo Resumen de la instalación:
echo ==========================
echo • Directorio de instalación: %INSTALL_DIR%
echo • Puerto del servicio: 4000
echo • Auto-actualización: Cada 5 minutos
echo • Logs: %INSTALL_DIR%\impresora-local\update.log
echo • ngrok: Integrado en el script de inicio
echo.
echo Archivos de control creados:
echo • %INSTALL_DIR%\start-impresora-ngrok.bat - Iniciar servicio + ngrok
echo • %INSTALL_DIR%\stop-impresora.bat - Parar servicio
echo • %INSTALL_DIR%\restart-impresora.bat - Reiniciar servicio
echo • %INSTALL_DIR%\status-impresora.bat - Ver estado
echo • %INSTALL_DIR%\logs-update.bat - Ver logs de actualización
echo.
echo El servicio se actualizará automáticamente cada 5 minutos
echo y se iniciará automáticamente con Windows.
echo.
echo Para iniciar el servicio ahora, ejecuta: %INSTALL_DIR%\start-impresora-ngrok.bat
echo.
pause
