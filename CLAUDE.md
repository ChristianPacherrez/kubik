# CLAUDE.md — Guía para Claude Code en Kubik

Este archivo le dice a Claude cómo trabajar correctamente en este proyecto.
Léelo completo antes de tocar cualquier archivo.

---

## ¿Qué es Kubik?

Kubik es una **oficina virtual gamificada** para equipos remotos.
Combina presencia en tiempo real, avatares con movimiento en un mapa pixel art 2D,
chat, salas virtuales y estados de usuario — todo con estética corporativa moderna.

Inspiración: Gather Town, pero enfocado en equipos corporativos.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), React, TypeScript, TailwindCSS |
| Mapa virtual | Phaser.js 3 (motor de juego 2D para el mapa pixel art) |
| Tiempo real | Socket.io (WebSockets para presencia y chat) |
| Autenticación | Clerk (sign-in/sign-up corporativo) |
| Backend | Node.js, Express, TypeScript |
| Base de datos | PostgreSQL + Prisma ORM |
| Deploy | Vercel (frontend), Railway o Render (backend) |

---

## Estructura del proyecto

```
kubik/
├── CLAUDE.md              ← estás aquí
├── project-rules.md       ← reglas de código que SIEMPRE se aplican
├── README.md              ← documentación pública del proyecto
├── .gitignore
│
├── frontend/              ← Next.js 14 App Router
│   └── src/
│       ├── app/           ← rutas (route groups: (auth), (office))
│       ├── components/    ← componentes React reutilizables
│       ├── hooks/         ← custom hooks (useSocket, usePresence, etc.)
│       ├── lib/           ← utilidades (socket singleton, etc.)
│       ├── store/         ← Zustand (estado global del cliente)
│       └── types/         ← tipos TypeScript compartidos
│
├── backend/               ← Express + Socket.io
│   ├── prisma/            ← schema.prisma y migraciones
│   └── src/
│       ├── config/        ← env, database (Prisma client)
│       ├── controllers/   ← entrada HTTP (solo valida y delega)
│       ├── middleware/     ← auth, error handling
│       ├── routes/        ← definición de rutas Express
│       ├── services/      ← lógica de negocio
│       ├── socket/        ← handlers de Socket.io
│       └── types/         ← tipos TypeScript del backend
│
├── docs/                  ← documentación técnica del proyecto
├── prompts/               ← prompts de desarrollo por funcionalidad
├── assets/                ← sprites, tilesets, fuentes pixel art
├── database/              ← schema de referencia y seeds
└── scripts/               ← scripts de setup y arranque
```

---

## Fases de desarrollo

El proyecto avanza en fases. **No saltar fases.**

| # | Fase | Estado |
|---|------|--------|
| 1 | Arquitectura base | ✅ Completada |
| 2 | Auth con Clerk | 🔄 Siguiente |
| 3 | Presencia realtime con Socket.io | ⏳ Pendiente |
| 4 | Mapa virtual con Phaser.js | ⏳ Pendiente |
| 5 | Chat realtime | ⏳ Pendiente |
| 6 | Salas y reuniones | ⏳ Pendiente |
| 7 | Gamificación | ⏳ Pendiente |

---

## Cómo trabajar en este proyecto

### Antes de escribir código

1. Lee `project-rules.md` — son las reglas que **siempre** aplican.
2. Revisa el archivo de docs relevante en `/docs/` para la funcionalidad.
3. Usa el prompt correspondiente en `/prompts/` como guía.

### Al escribir código

- **TypeScript strict** en todo. Nunca `any`.
- **Modular**: un archivo = una responsabilidad.
- **Comentarios solo para el WHY**, no para el WHAT.
- Sigue la estructura de carpetas existente. No inventar nuevas capas.

### Al modificar la base de datos

- Siempre crear una migración Prisma: `pnpm db:migrate`
- Nunca editar la base de datos directamente.
- Actualizar el seed si se agregan datos de prueba.

### Al modificar Socket.io

- Todos los eventos están tipados en `src/types/index.ts` (enum `SocketEvents`).
- Nunca usar strings literales para eventos — siempre usar el enum.
- Un handler = un archivo en `src/socket/handlers/`.

---

## Variables de entorno requeridas

### Backend (`backend/.env`)
```
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/kubik
CLERK_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/office
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/office
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Comandos frecuentes

```bash
# Setup inicial (solo la primera vez)
./scripts/setup.sh

# Arrancar todo en paralelo
./scripts/dev.sh

# Solo frontend
cd frontend && pnpm dev

# Solo backend
cd backend && pnpm dev

# Migraciones de base de datos
cd backend && pnpm db:migrate

# Ver la base de datos visualmente
cd backend && pnpm db:studio

# Seed (datos de prueba)
cd backend && pnpm db:seed
```

---

## Convenciones de nombres

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Componentes React | PascalCase | `OnlineUsers.tsx` |
| Hooks | camelCase con `use` | `useSocket.ts` |
| Servicios | camelCase con `.service` | `users.service.ts` |
| Controladores | camelCase con `.controller` | `users.controller.ts` |
| Rutas Express | camelCase con `.route` | `users.route.ts` |
| Tipos TS | PascalCase | `UserStatus`, `SocketEvents` |
| Variables de entorno | UPPER_SNAKE_CASE | `DATABASE_URL` |

---

## Modelos de datos principales

```typescript
// Usuario
User {
  id, clerkId, email, name, avatarUrl,
  role: HOST | ADMIN | COLLABORATOR,
  status: AVAILABLE | BUSY | IN_MEETING | AWAY,
  isOnline, lastSeen, createdAt
}

// Sala
Room {
  id, name, slug, type: LOBBY | MEETING | LOUNGE | FOCUS,
  maxCapacity, isActive, createdAt
}
```

---

## Contexto importante para Claude

- El usuario **no es desarrollador experto** — explicar decisiones en español, con lenguaje claro.
- Priorizar **experiencia realtime** sobre otras consideraciones de rendimiento.
- El **mapa Phaser.js** se integra como un componente React con `useEffect` y ref al canvas.
- Clerk maneja **toda la autenticación** — no implementar auth manual.
- La conexión Socket.io se autentica pasando el **JWT de Clerk** en el handshake.
- Zustand maneja el **estado global del cliente** (usuarios online, mensajes, sala actual).
