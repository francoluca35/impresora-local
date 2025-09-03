@echo off
REM Script de configuración inicial para impresora-local en Windows
REM Se ejecuta UNA SOLA VEZ en la PC del cliente

REM Configuración
set REPO_URL=https://github.com/francoluca35/impresora-local.git
set INSTALL_DIR=C:\Users\Administrador\impresora-local
set SERVICE_NAME=impresora-local

REM Colores para output (Windows 10+)
color 0A

echo [PASO] Iniciando configuración de impresora-local para Windows...
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

REM Verificar si PM2 está instalado
echo [INFO] Verificando PM2...
pm2 --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Instalando PM2...
    npm install -g pm2
) else (
    echo [INFO] PM2 ya está instalado
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

REM Crear archivo de configuración del servicio
echo [INFO] Creando archivo de configuración del servicio...
echo @echo off > "%INSTALL_DIR%\start-impresora.bat"
echo title Servidor de impresión + Ngrok >> "%INSTALL_DIR%\start-impresora.bat"
echo cd /d "%INSTALL_DIR%\impresora-local >> "%INSTALL_DIR%\start-impresora.bat"
echo. >> "%INSTALL_DIR%\start-impresora.bat"
echo :: Inicia index.js con Node.js >> "%INSTALL_DIR%\start-impresora.bat"
echo start "Servidor de Impresión" cmd /k node index.js >> "%INSTALL_DIR%\start-impresora.bat"
echo. >> "%INSTALL_DIR%\start-impresora.bat"
echo :: Espera 5 segundos y luego lanza ngrok >> "%INSTALL_DIR%\start-impresora.bat"
echo timeout /t 5 /nobreak ^> NUL >> "%INSTALL_DIR%\start-impresora.bat"
echo start "Ngrok" cmd /k C:\Users\Administrator\ngrok\ngrok.exe http --url=right-worthy-collie.ngrok-free.app 4000 >> "%INSTALL_DIR%\start-impresora.bat"

REM Crear archivo de parada del servicio
echo @echo off > "%INSTALL_DIR%\stop-impresora.bat"
echo pm2 stop impresora >> "%INSTALL_DIR%\stop-impresora.bat"
echo pm2 delete impresora >> "%INSTALL_DIR%\stop-impresora.bat"
echo pause >> "%INSTALL_DIR%\stop-impresora.bat"

REM Crear archivo de reinicio del servicio
echo @echo off > "%INSTALL_DIR%\restart-impresora.bat"
echo pm2 restart impresora >> "%INSTALL_DIR%\restart-impresora.bat"
echo pause >> "%INSTALL_DIR%\restart-impresora.bat"

REM Crear archivo de estado del servicio
echo @echo off > "%INSTALL_DIR%\status-impresora.bat"
echo pm2 status >> "%INSTALL_DIR%\status-impresora.bat"
echo echo. >> "%INSTALL_DIR%\status-impresora.bat"
echo echo Presiona cualquier tecla para continuar... >> "%INSTALL_DIR%\status-impresora.bat"
echo pause ^>nul >> "%INSTALL_DIR%\status-impresora.bat"

REM Crear archivo de logs del servicio
echo @echo off > "%INSTALL_DIR%\logs-impresora.bat"
echo pm2 logs impresora --lines 100 >> "%INSTALL_DIR%\logs-impresora.bat"
echo echo. >> "%INSTALL_DIR%\logs-impresora.bat"
echo echo Presiona cualquier tecla para continuar... >> "%INSTALL_DIR%\logs-impresora.bat"
echo pause ^>nul >> "%INSTALL_DIR%\logs-impresora.bat"

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

REM Iniciar servicio con PM2
echo [INFO] Iniciando servicio con PM2...
cd /d "%INSTALL_DIR%\impresora-local"
pm2 start index.js --name "impresora"
pm2 save

REM Configurar PM2 para iniciar con Windows
echo [INFO] Configurando PM2 para iniciar con Windows...
pm2 startup

REM Crear tarea programada para auto-actualización
echo [INFO] Creando tarea programada para auto-actualización...
schtasks /create /tn "ImpresoraLocal-AutoUpdate" /tr "%INSTALL_DIR%\impresora-local\auto-update.bat" /sc minute /mo 5 /ru "Administrador" /f

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
echo.
echo Archivos de control creados:
echo • %INSTALL_DIR%\start-impresora.bat - Iniciar servicio
echo • %INSTALL_DIR%\stop-impresora.bat - Parar servicio
echo • %INSTALL_DIR%\restart-impresora.bat - Reiniciar servicio
echo • %INSTALL_DIR%\status-impresora.bat - Ver estado
echo • %INSTALL_DIR%\logs-impresora.bat - Ver logs del servicio
echo • %INSTALL_DIR%\logs-update.bat - Ver logs de actualización
echo.
echo El servicio se actualizará automáticamente cada 5 minutos
echo y se iniciará automáticamente con Windows.
echo.
echo Para iniciar el servicio ahora, ejecuta: %INSTALL_DIR%\start-impresora.bat
echo.
pause
