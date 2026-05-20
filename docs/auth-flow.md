# Flujo de Autenticación — Kubik

Cómo funciona el sistema de autenticación desde que el usuario abre la app hasta que está dentro de la oficina.

---

## ¿Por qué Clerk?

Clerk es un servicio especializado en autenticación. Las razones de elegirlo sobre implementar auth manualmente:

1. **Seguridad garantizada** — No tenemos que gestionar contraseñas, tokens, sesiones. Clerk lo hace.
2. **OAuth corporativo incluido** — Google Workspace, Microsoft 365, SAML listos para usar.
3. **Webhooks** — Clerk notifica a nuestro backend cuando un usuario se registra/actualiza.
4. **UI lista** — Páginas de sign-in/sign-up con buen diseño sin trabajo extra.
5. **JWT incluido** — Clerk genera tokens que usamos para autenticar Socket.io.

---

## Flujo completo (paso a paso)

```
Usuario                  Frontend (Next.js)          Clerk           Backend (Express)         BD (PostgreSQL)
  │                           │                        │                    │                        │
  │ Abre kubik.com             │                        │                    │                        │
  ├──────────────────────────►│                        │                    │                        │
  │                           │ ¿Está autenticado?     │                    │                        │
  │                           ├───────────────────────►│                    │                        │
  │                           │ NO                     │                    │                        │
  │                           │◄───────────────────────┤                    │                        │
  │                           │                        │                    │                        │
  │◄──────────────────────────┤ Redirige a /sign-in    │                    │                        │
  │                           │                        │                    │                        │
  │ Introduce email/contraseña │                        │                    │                        │
  ├──────────────────────────►│                        │                    │                        │
  │                           ├───────────────────────►│                    │                        │
  │                           │   Verifica credenciales│                    │                        │
  │                           │                  JWT   │                    │                        │
  │                           │◄───────────────────────┤                    │                        │
  │                           │                        │                    │                        │
  │                           │ Redirige a /office     │                    │                        │
  │◄──────────────────────────┤                        │                    │                        │
  │                           │                        │                    │                        │
  │                           │ Conecta Socket.io con JWT                   │                        │
  │                           ├────────────────────────────────────────────►│                        │
  │                           │                        │ Verifica JWT        │                        │
  │                           │                        │◄────────────────────┤                        │
  │                           │                        │ Válido              │                        │
  │                           │                        ├────────────────────►│                        │
  │                           │                        │                    │ Upsert usuario          │
  │                           │                        │                    ├───────────────────────►│
  │                           │                        │                    │◄───────────────────────┤
  │                           │                        │                    │ Usuario listo           │
  │◄────────────────────────────────────────────────────────────────────────┤                        │
  │  Oficina cargada con presencia activa               │                    │                        │
```

---

## Flujo de registro (nuevo usuario)

```
1. Usuario visita /sign-up
2. Introduce email + contraseña (o usa Google/Microsoft)
3. Clerk envía email de verificación
4. Usuario verifica email
5. Clerk crea el usuario en su sistema
6. Clerk dispara webhook POST /api/webhooks/clerk a nuestro backend
7. Backend crea el usuario en PostgreSQL con role=COLLABORATOR por defecto
8. Frontend redirige a /office
```

---

## Webhook de Clerk → Backend

Cuando un usuario se registra, Clerk llama a nuestro backend:

```typescript
// backend/src/webhook/clerk.webhook.ts

// POST /api/webhooks/clerk
// Clerk envía este payload cuando ocurre un evento de usuario
router.post('/clerk', async (req, res) => {
  const event = req.body  // tipo: WebhookEvent de Clerk

  if (event.type === 'user.created') {
    await usersService.createFromClerk({
      clerkId: event.data.id,
      email: event.data.email_addresses[0].email_address,
      name: `${event.data.first_name} ${event.data.last_name}`,
      avatarUrl: event.data.image_url,
    })
  }

  if (event.type === 'user.updated') {
    await usersService.updateFromClerk({ ... })
  }
})
```

**Importante:** El webhook debe validar la firma de Clerk para evitar requests falsos.

---

## Autenticación en Socket.io

El cliente envía el JWT de Clerk en el handshake:

```typescript
// frontend/src/lib/socket.ts
const socket = io(SOCKET_URL, {
  auth: { token: await getToken() }  // getToken() viene del hook useAuth de Clerk
})
```

El backend verifica el token antes de aceptar la conexión:

```typescript
// backend/src/socket/index.ts
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token
  const { userId } = await clerkClient.verifyToken(token)
  socket.data.clerkId = userId
  next()
})
```

---

## Roles de usuario

| Rol | Permisos |
|-----|----------|
| `HOST` | Todo. Puede administrar la instancia de Kubik, crear/eliminar salas, gestionar usuarios. |
| `ADMIN` | Puede gestionar usuarios de su organización, configurar salas. |
| `COLLABORATOR` | Puede usar la oficina, cambiar su estado, chatear. Rol por defecto. |

El rol se asigna en la base de datos. Clerk solo maneja autenticación, los roles son de nuestra aplicación.

---

## Protección de rutas

### Frontend — Route Groups

```typescript
// frontend/src/app/(office)/layout.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function OfficeLayout({ children }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')  // Si no está autenticado, a sign-in
  return <>{children}</>
}
```

### Backend — Middleware

```typescript
// backend/src/middleware/auth.middleware.ts
// Verifica el JWT de Clerk en cada request a rutas protegidas
// Si el token es inválido, devuelve 401
```

---

## Estados de sesión en el frontend

El hook `useAuth()` de Clerk expone:

```typescript
const { isLoaded, isSignedIn, userId, getToken } = useAuth()

// isLoaded = false mientras Clerk carga (mostrar spinner)
// isSignedIn = si el usuario tiene sesión activa
// userId = el clerkId del usuario (string)
// getToken() = devuelve el JWT para autenticar Socket.io y llamadas a la API
```

---

## Archivos relevantes

| Archivo | Función |
|---------|---------|
| `frontend/src/app/layout.tsx` | Envuelve toda la app con `<ClerkProvider>` |
| `frontend/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Página de login (componente de Clerk) |
| `frontend/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Página de registro (componente de Clerk) |
| `frontend/src/app/(office)/layout.tsx` | Protege todas las rutas de la oficina |
| `backend/src/middleware/auth.middleware.ts` | Verifica JWT en rutas REST |
| `backend/src/socket/index.ts` | Verifica JWT en conexión Socket.io |
| `backend/src/webhook/clerk.webhook.ts` | Recibe eventos de Clerk |
