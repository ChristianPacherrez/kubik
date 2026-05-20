#!/bin/bash

# Script de setup inicial: instala dependencias y crea archivos .env desde los ejemplos

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Kubik - Setup Inicial${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# --- Backend ---
echo -e "${GREEN}[1/4]${NC} Instalando dependencias del backend..."
cd "$ROOT_DIR/backend"
pnpm install
echo -e "${GREEN}✓ Backend: dependencias instaladas${NC}"
echo ""

# Crear .env del backend si no existe
echo -e "${GREEN}[2/4]${NC} Configurando variables de entorno del backend..."
if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
  echo -e "${YELLOW}⚠ Se creó backend/.env desde .env.example${NC}"
  echo -e "${YELLOW}  Edita backend/.env con tus credenciales reales antes de continuar.${NC}"
else
  echo -e "${GREEN}✓ backend/.env ya existe, no se sobreescribió${NC}"
fi
echo ""

# --- Frontend ---
echo -e "${GREEN}[3/4]${NC} Instalando dependencias del frontend..."
cd "$ROOT_DIR/frontend"
pnpm install
echo -e "${GREEN}✓ Frontend: dependencias instaladas${NC}"
echo ""

# Crear .env.local del frontend si no existe
echo -e "${GREEN}[4/4]${NC} Configurando variables de entorno del frontend..."
if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
  cp "$ROOT_DIR/frontend/.env.local.example" "$ROOT_DIR/frontend/.env.local"
  echo -e "${YELLOW}⚠ Se creó frontend/.env.local desde .env.local.example${NC}"
  echo -e "${YELLOW}  Edita frontend/.env.local con tus claves de Clerk.${NC}"
else
  echo -e "${GREEN}✓ frontend/.env.local ya existe, no se sobreescribió${NC}"
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Setup completado ✓${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Próximos pasos:"
echo "  1. Edita ${YELLOW}backend/.env${NC} con tu DATABASE_URL y CLERK_SECRET_KEY"
echo "  2. Edita ${YELLOW}frontend/.env.local${NC} con tus claves de Clerk"
echo "  3. Corre las migraciones: ${YELLOW}cd backend && pnpm db:migrate${NC}"
echo "  4. Corre los seeds: ${YELLOW}cd backend && pnpm db:seed${NC}"
echo "  5. Inicia el proyecto: ${YELLOW}./scripts/dev.sh${NC}"
echo ""
