@echo off
REM Script de auto-actualización para impresora-local en Windows
REM Se ejecuta cada 5 minutos vía Task Scheduler

REM Configuración
set REPO_DIR=C:\Users\Administrador\impresora-local
set LOG_FILE=C:\Users\Administrador\impresora-local\update.log
set BRANCH=main

REM Función de logging
:log
echo %date% %time% - %~1 | tee -a "%LOG_FILE%"
goto :eof

REM Verificar si el directorio del repo existe
if not exist "%REPO_DIR%" (
    call :log "ERROR: Directorio del repositorio no encontrado: %REPO_DIR%"
    exit /b 1
)

REM Cambiar al directorio del repositorio
cd /d "%REPO_DIR%"
if errorlevel 1 (
    call :log "ERROR: No se puede cambiar al directorio: %REPO_DIR%"
    exit /b 1
)

REM Verificar si hay cambios remotos
call :log "Verificando actualizaciones..."
git fetch origin

REM Obtener el commit actual y el remoto
for /f "tokens=*" %%i in ('git rev-parse HEAD') do set LOCAL_COMMIT=%%i
for /f "tokens=*" %%i in ('git rev-parse origin/%BRANCH%') do set REMOTE_COMMIT=%%i

REM Si hay cambios, actualizar
if not "%LOCAL_COMMIT%"=="%REMOTE_COMMIT%" (
    call :log "Nuevas actualizaciones detectadas. Actualizando..."
    
    REM Hacer backup del archivo de configuración si existe
    if exist "config.json" (
        copy "config.json" "config.json.backup"
        call :log "Backup de configuración creado"
    )
    
    REM Actualizar código
    git pull origin %BRANCH%
    
    REM Instalar dependencias si hay cambios en package.json
    for /f "tokens=*" %%i in ('git diff --name-only HEAD~1 HEAD ^| findstr "package.json"') do (
        call :log "Instalando nuevas dependencias..."
        npm install
        goto :deps_installed
    )
    :deps_installed
    
    REM Reiniciar el proceso PM2
    call :log "Reiniciando proceso PM2..."
    pm2 restart impresora
    
    REM Restaurar configuración si es necesario
    if exist "config.json.backup" if not exist "config.json" (
        move "config.json.backup" "config.json"
        call :log "Configuración restaurada"
    )
    
    call :log "Actualización completada exitosamente"
) else (
    call :log "No hay actualizaciones disponibles"
)

exit /b 0
