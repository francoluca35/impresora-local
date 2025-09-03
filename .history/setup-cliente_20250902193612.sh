#!/bin/bash

# Script de configuración inicial para el cliente
# Se ejecuta UNA SOLA VEZ en la PC del cliente

# Configuración
REPO_URL="https://github.com/tu-usuario/impresora-servidor.git"
INSTALL_DIR="/opt/impresora-local"
SERVICE_USER="impresora"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[PASO]${NC} $1"
}

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    log_error "Este script debe ejecutarse como root (sudo)"
    exit 1
fi

log_step "Iniciando configuración de impresora-local..."

# Crear usuario del servicio
log_info "Creando usuario del servicio..."
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d "$INSTALL_DIR" "$SERVICE_USER"
    log_info "Usuario $SERVICE_USER creado"
else
    log_info "Usuario $SERVICE_USER ya existe"
fi

# Crear directorio de instalación
log_info "Creando directorio de instalación..."
mkdir -p "$INSTALL_DIR"
chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"

# Instalar dependencias del sistema
log_info "Instalando dependencias del sistema..."
if command -v apt-get &> /dev/null; then
    # Ubuntu/Debian
    apt-get update
    apt-get install -y git curl wget
elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    yum install -y git curl wget
elif command -v dnf &> /dev/null; then
    # Fedora
    dnf install -y git curl wget
else
    log_error "No se pudo determinar el gestor de paquetes"
    exit 1
fi

# Instalar Node.js si no está instalado
if ! command -v node &> /dev/null; then
    log_info "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    log_info "Node.js ya está instalado: $(node --version)"
fi

# Instalar PM2 globalmente
log_info "Instalando PM2..."
npm install -g pm2

# Clonar repositorio
log_info "Clonando repositorio desde GitHub..."
cd "$INSTALL_DIR"
if [ -d "impresora-servidor" ]; then
    log_warn "El directorio ya existe, actualizando..."
    cd impresora-servidor
    git pull origin main
else
    git clone "$REPO_URL" impresora-servidor
    cd impresora-servidor
fi

# Instalar dependencias de Node.js
log_info "Instalando dependencias de Node.js..."
npm install

# Configurar script de auto-actualización
log_info "Configurando script de auto-actualización..."
cp auto-update.sh /usr/local/bin/
chmod +x /usr/local/bin/auto-update.sh

# Actualizar ruta en el script
sed -i "s|/ruta/a/impresora-local|$INSTALL_DIR|g" /usr/local/bin/auto-update.sh

# Crear directorio de logs
mkdir -p /var/log
touch /var/log/impresora-update.log
chown "$SERVICE_USER:$SERVICE_USER" /var/log/impresora-update.log

# Configurar crontab para auto-actualización
log_info "Configurando crontab para auto-actualización..."
(crontab -u "$SERVICE_USER" -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/auto-update.sh") | crontab -u "$SERVICE_USER" -

# Iniciar servicio con PM2
log_info "Iniciando servicio con PM2..."
cd "$INSTALL_DIR/impresora-servidor"
pm2 start index.js --name "impresora" --user "$SERVICE_USER"
pm2 startup
pm2 save

# Configurar PM2 para iniciar con el sistema
pm2 startup systemd -u "$SERVICE_USER" --hp "$INSTALL_DIR"

# Crear archivo de configuración del sistema
log_info "Creando archivo de configuración del sistema..."
cat > /etc/systemd/system/impresora.service << EOF
[Unit]
Description=Impresora Local Service
After=network.target

[Service]
Type=forking
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR/impresora-servidor
ExecStart=/usr/bin/pm2 start index.js --name impresora
ExecReload=/usr/bin/pm2 reload impresora
ExecStop=/usr/bin/pm2 stop impresora
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Habilitar y iniciar servicio del sistema
systemctl daemon-reload
systemctl enable impresora
systemctl start impresora

# Verificar estado
log_info "Verificando estado del servicio..."
if systemctl is-active --quiet impresora; then
    log_info "Servicio iniciado correctamente"
else
    log_error "Error al iniciar el servicio"
    systemctl status impresora
fi

# Mostrar información final
log_step "Configuración completada!"
echo ""
echo "Resumen de la instalación:"
echo "=========================="
echo "• Usuario del servicio: $SERVICE_USER"
echo "• Directorio de instalación: $INSTALL_DIR"
echo "• Puerto del servicio: 4000"
echo "• Auto-actualización: Cada 5 minutos"
echo "• Logs: /var/log/impresora-update.log"
echo ""
echo "Comandos útiles:"
echo "• Ver estado: pm2 status"
echo "• Ver logs: pm2 logs impresora"
echo "• Reiniciar: pm2 restart impresora"
echo "• Ver logs de actualización: tail -f /var/log/impresora-update.log"
echo ""
echo "El servicio se actualizará automáticamente cada 5 minutos"
echo "y se reiniciará automáticamente con el sistema."
