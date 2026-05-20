# Prompt — Autenticación con Clerk

Usa este prompt cuando trabajes en la Fase 2 del proyecto Kubik.
Cópialo y pégalo como contexto al iniciar una conversación sobre auth.

---

## Contexto del proyecto

Estoy construyendo Kubik, una oficina virtual gamificada para equipos remotos.
El proyecto usa Next.js 14 (App Router), TypeScript, Express, PostgreSQL con Prisma, y Clerk para autenticación.

La estructura del proyecto está en `~/Documents/claude/projects/kubik`.
Lee el archivo `CLAUDE.md` para entender la arquitectura completa.

## Lo que necesito implementar

[DESCRIBE AQUÍ LO QUE NECESITAS]

Ejemplos:
- "Necesito configurar el webhook de Clerk para crear usuarios en PostgreSQL"
- "Necesito proteger las rutas del backend con el middleware de Clerk"
- "Necesito implementar el flujo de sign-up con Clerk en Next.js"

## Lo que ya existe

- `frontend/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` — página de login
- `frontend/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` — página de registro
- `frontend/src/app/(office)/layout.tsx` — layout protegido con auth()
- `backend/src/middleware/auth.middleware.ts` — middleware que verifica JWT
- `backend/src/services/users.service.ts` — servicio de usuarios con upsertUser

## Reglas importantes

- Clerk maneja TODA la autenticación. No implementar auth manual.
- Los roles (HOST, ADMIN, COLLABORATOR) son de nuestra BD, no de Clerk.
- La contraseña nunca toca nuestro backend.
- El JWT de Clerk también se usa para autenticar Socket.io.
- El usuario se crea en PostgreSQL via webhook cuando se registra en Clerk.

## Stack relevante

- `@clerk/nextjs` v5 en el frontend
- `@clerk/clerk-sdk-node` v4 en el backend
- Prisma model `User` con campo `clerkId: String @unique`
