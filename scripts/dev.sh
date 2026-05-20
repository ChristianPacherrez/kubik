#!/bin/bash

# Inicia el frontend y el backend en paralelo con colores distintos para distinguir los logs

set -e

# Colores para distinguir los logs de cada proceso
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # Sin color

echo -e "${GREEN}🚀 Iniciando Kubik en modo desarrollo...${NC}"
echo ""

# Verificar que existen las carpetas
if [ ! -d "$(dirname "$0")/../backend" ] || [ ! -d "$(dirname "$0")/../frontend" ]; then
  echo -e "${RED}Error: Asegúrate de correr este script desde la raíz del proyecto.${NC}"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Función para matar procesos hijos cuando se cierra el script
cleanup() {
  echo ""
  echo -e "${RED}Deteniendo servidores...${NC}"
  kill 0
  exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar el backend
echo -e "${BLUE}[Backend]${NC} Iniciando en puerto 3001..."
(cd "$ROOT_DIR/backend" && pnpm dev 2>&1 | sed "s/^/$(echo -e "${BLUE}[Backend]${NC}") /") &

# Pequeña pausa para que el backend arranque primero
sleep 2

# Iniciar el frontend
echo -e "${GREEN}[Frontend]${NC} Iniciando en puerto 3000..."
(cd "$ROOT_DIR/frontend" && pnpm dev 2>&1 | sed "s/^/$(echo -e "${GREEN}[Frontend]${NC}") /") &

# Esperar a que ambos procesos terminen
wait
