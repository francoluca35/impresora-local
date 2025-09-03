#!/bin/bash

# Script de despliegue para impresora-local
# Se ejecuta desde tu PC para subir cambios al repositorio

# Configuración
REPO_NAME="impresora-servidor"
COMMIT_MESSAGE=""
BRANCH="main"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función de logging con colores
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si estamos en un repositorio git
if [ ! -d ".git" ]; then
    log_error "No se detectó un repositorio git. Ejecuta este script desde el directorio del proyecto."
    exit 1
fi

# Verificar si hay cambios sin commitear
if [ -z "$(git status --porcelain)" ]; then
    log_warn "No hay cambios para subir al repositorio."
    exit 0
fi

# Mostrar estado actual
log_info "Estado actual del repositorio:"
git status --short

# Solicitar mensaje de commit si no se proporcionó
if [ -z "$COMMIT_MESSAGE" ]; then
    echo -n "Ingresa el mensaje del commit: "
    read -r COMMIT_MESSAGE
    
    if [ -z "$COMMIT_MESSAGE" ]; then
        COMMIT_MESSAGE="Actualización automática $(date '+%Y-%m-%d %H:%M:%S')"
        log_info "Usando mensaje de commit por defecto: $COMMIT_MESSAGE"
    fi
fi

# Agregar todos los cambios
log_info "Agregando cambios..."
git add .

# Hacer commit
log_info "Haciendo commit con mensaje: $COMMIT_MESSAGE"
if git commit -m "$COMMIT_MESSAGE"; then
    log_info "Commit realizado exitosamente"
else
    log_error "Error al hacer commit"
    exit 1
fi

# Subir cambios al repositorio remoto
log_info "Subiendo cambios a GitHub..."
if git push origin $BRANCH; then
    log_info "Cambios subidos exitosamente a GitHub"
    log_info "El cliente se actualizará automáticamente en los próximos 5 minutos"
else
    log_error "Error al subir cambios a GitHub"
    exit 1
fi

# Mostrar resumen
log_info "Despliegue completado exitosamente!"
log_info "Último commit: $(git log -1 --oneline)"
