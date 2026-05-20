# Kubik 🏢

**Oficina virtual gamificada** para equipos remotos. Kubik combina la presencia en tiempo real de una oficina física con la gamificación, permitiendo que los equipos colaboren en un espacio virtual con avatares, salas temáticas y comunicación fluida.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14, React, TypeScript, TailwindCSS |
| Mapa Virtual | Phaser.js (motor de juego 2D) |
| Tiempo Real | Socket.io (WebSockets) |
| Autenticación | Clerk |
| Backend | Node.js, Express, TypeScript |
| Base de Datos | PostgreSQL + Prisma ORM |

## Estructura del Proyecto

```
kubik/
├── frontend/          # Aplicación Next.js
├── backend/           # Servidor Express + Socket.io
├── docs/              # Documentación técnica
├── prompts/           # Prompts de IA para desarrollo
├── assets/            # Sprites, tilesets compartidos
├── database/          # Esquema Prisma + migraciones
└── scripts/           # Scripts para correr el proyecto
```

## Cómo Correr el Proyecto

### Prerrequisitos

- Node.js 18+
- pnpm 9+ (`npm install -g pnpm`)
- PostgreSQL 15+
- Una cuenta en [Clerk](https://clerk.com) (gratis)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <url>
cd kubik

# 2. Ejecutar el script de setup (instala dependencias y crea .env)
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Configurar las variables de entorno
# Editar backend/.env con tu DATABASE_URL y CLERK_SECRET_KEY
# Editar frontend/.env.local con tus claves de Clerk

# 4. Configurar la base de datos
cd backend
pnpm db:migrate
pnpm db:seed

# 5. Iniciar el proyecto
cd ..
chmod +x scripts/dev.sh
./scripts/dev.sh
```

### Acceder a la App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Prisma Studio**: `cd backend && pnpm db:studio`

## Variables de Entorno

### Backend (`backend/.env`)
```
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/kubik
CLERK_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Comandos Útiles

```bash
# Backend
cd backend
pnpm dev             # Desarrollo con hot reload
pnpm db:studio       # Abrir Prisma Studio (GUI de BD)
pnpm db:migrate      # Correr migraciones
pnpm db:seed         # Poblar BD con datos de prueba

# Frontend
cd frontend
pnpm dev             # Desarrollo
pnpm build           # Build de producción
pnpm lint            # Verificar código
```

## Documentación

- [Arquitectura del Sistema](docs/architecture.md)
- [Plan de Fases](docs/phases.md)
- [Documentación de API](docs/api.md)
# kubik
# kubik
