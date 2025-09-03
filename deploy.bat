@echo off
REM Script de despliegue para impresora-local en Windows
REM Se ejecuta desde tu PC para subir cambios al repositorio

REM Configuración
set REPO_NAME=impresora-local
set COMMIT_MESSAGE=
set BRANCH=main

REM Colores para output (Windows 10+)
color 0A

REM Función de logging con colores
:log_info
echo [INFO] %~1
goto :eof

:log_warn
echo [WARN] %~1
goto :eof

:log_error
echo [ERROR] %~1
goto :eof

REM Verificar si estamos en un repositorio git
if not exist ".git" (
    call :log_error "No se detectó un repositorio git. Ejecuta este script desde el directorio del proyecto."
    pause
    exit /b 1
)

REM Verificar si hay cambios sin commitear
git status --porcelain >nul 2>&1
if %errorLevel% neq 0 (
    call :log_warn "No hay cambios para subir al repositorio."
    pause
    exit /b 0
)

REM Mostrar estado actual
call :log_info "Estado actual del repositorio:"
git status --short

REM Solicitar mensaje de commit si no se proporcionó
if "%COMMIT_MESSAGE%"=="" (
    set /p COMMIT_MESSAGE="Ingresa el mensaje del commit: "
    
    if "%COMMIT_MESSAGE%"=="" (
        set COMMIT_MESSAGE=Actualización automática %date% %time%
        call :log_info "Usando mensaje de commit por defecto: %COMMIT_MESSAGE%"
    )
)

REM Agregar todos los cambios
call :log_info "Agregando cambios..."
git add .

REM Hacer commit
call :log_info "Haciendo commit con mensaje: %COMMIT_MESSAGE%"
git commit -m "%COMMIT_MESSAGE%"
if %errorLevel% neq 0 (
    call :log_error "Error al hacer commit"
    pause
    exit /b 1
)
call :log_info "Commit realizado exitosamente"

REM Subir cambios al repositorio remoto
call :log_info "Subiendo cambios a GitHub..."
git push origin %BRANCH%
if %errorLevel% neq 0 (
    call :log_error "Error al subir cambios a GitHub"
    pause
    exit /b 1
)

REM Mostrar resumen
call :log_info "Cambios subidos exitosamente a GitHub"
call :log_info "El cliente se actualizará automáticamente en los próximos 5 minutos"
call :log_info "Despliegue completado exitosamente!"

REM Mostrar último commit
for /f "tokens=*" %%i in ('git log -1 --oneline') do (
    call :log_info "Último commit: %%i"
)

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
