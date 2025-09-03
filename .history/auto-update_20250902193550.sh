#!/bin/bash

# Script de auto-actualización para impresora-local
# Se ejecuta cada 5 minutos vía crontab

# Configuración
REPO_DIR="/ruta/a/impresora-local/impresora-servidor"
LOG_FILE="/var/log/impresora-update.log"
BRANCH="main"

# Función de logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Verificar si el directorio del repo existe
if [ ! -d "$REPO_DIR" ]; then
    log "ERROR: Directorio del repositorio no encontrado: $REPO_DIR"
    exit 1
fi

# Cambiar al directorio del repositorio
cd "$REPO_DIR" || {
    log "ERROR: No se puede cambiar al directorio: $REPO_DIR"
    exit 1
}

# Verificar si hay cambios remotos
log "Verificando actualizaciones..."
git fetch origin

# Obtener el commit actual y el remoto
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/$BRANCH)

# Si hay cambios, actualizar
if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    log "Nuevas actualizaciones detectadas. Actualizando..."
    
    # Hacer backup del archivo de configuración si existe
    if [ -f "config.json" ]; then
        cp config.json config.json.backup
        log "Backup de configuración creado"
    fi
    
    # Actualizar código
    git pull origin $BRANCH
    
    # Instalar dependencias si hay cambios en package.json
    if git diff --name-only HEAD~1 HEAD | grep -q "package.json"; then
        log "Instalando nuevas dependencias..."
        npm install
    fi
    
    # Reiniciar el proceso PM2
    log "Reiniciando proceso PM2..."
    pm2 restart impresora
    
    # Restaurar configuración si es necesario
    if [ -f "config.json.backup" ] && [ ! -f "config.json" ]; then
        mv config.json.backup config.json
        log "Configuración restaurada"
    fi
    
    log "Actualización completada exitosamente"
else
    log "No hay actualizaciones disponibles"
fi
