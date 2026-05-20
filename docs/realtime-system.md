# Sistema Realtime — Kubik

Cómo funciona la comunicación en tiempo real entre todos los clientes conectados.

---

## ¿Por qué Socket.io?

Socket.io es la librería estándar para WebSockets en Node.js:

- **Reconexión automática** — si el cliente pierde conexión, se reconecta sin código extra.
- **Rooms built-in** — agrupa clientes por sala (lobby, reunión, etc.) sin trabajo manual.
- **Fallback** — si WebSockets no funcionan, cae a long-polling automáticamente.
- **TypeScript friendly** — se puede tipar todos los eventos.

---

## Arquitectura del sistema realtime

```
                    ┌─────────────────────────────────┐
                    │         Socket.io Server         │
                    │         (puerto 3001)             │
                    │                                   │
                    │  ┌──────────────────────────┐    │
                    │  │  Middleware de autenticación│   │
                    │  │  Verifica JWT de Clerk     │   │
                    │  └──────────────────────────┘    │
                    │                                   │
                    │  Handlers registrados:            │
                    │  • presence.handler.ts            │
                    │  • chat.handler.ts                │
                    │  • movement.handler.ts (Fase 4)   │
                    └────────────┬────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
    ┌─────────▼──────┐  ┌────────▼──────┐  ┌───────▼────────┐
    │  Cliente 1      │  │  Cliente 2    │  │   Cliente N    │
    │  (Navegador)   │  │  (Navegador)  │  │  (Navegador)   │
    └────────────────┘  └───────────────┘  └────────────────┘
```

---

## Eventos de Socket.io — Catálogo completo

Los eventos están tipados en `backend/src/types/index.ts` y `frontend/src/types/index.ts`.

### Eventos de Presencia

| Evento | Dirección | Payload | Descripción |
|--------|-----------|---------|-------------|
| `user:connect` | Cliente → Servidor | `{ clerkId, name, email, avatarUrl }` | Usuario entra a la oficina |
| `user:status` | Cliente → Servidor | `{ status: UserStatus }` | Usuario cambia su estado |
| `presence:update` | Servidor → Todos | `User[]` | Lista actualizada de usuarios online |

### Eventos de Chat

| Evento | Dirección | Payload | Descripción |
|--------|-----------|---------|-------------|
| `chat:message` | Cliente → Servidor | `{ roomId, content }` | Usuario envía un mensaje |
| `chat:message:broadcast` | Servidor → Sala | `{ id, userId, name, content, timestamp }` | Mensaje distribuido a la sala |
| `chat:typing` | Cliente → Servidor | `{ roomId, isTyping }` | Usuario está escribiendo |
| `chat:typing:broadcast` | Servidor → Sala | `{ userId, name, isTyping }` | Indicador de escritura |

### Eventos de Movimiento (Fase 4)

| Evento | Dirección | Payload | Descripción |
|--------|-----------|---------|-------------|
| `player:move` | Cliente → Servidor | `{ x, y, direction }` | Avatar se movió |
| `player:move:broadcast` | Servidor → Sala | `{ userId, x, y, direction }` | Posición de otro avatar |
| `player:room:join` | Cliente → Servidor | `{ roomId }` | Avatar entra a una sala |
| `player:room:leave` | Cliente → Servidor | `{ roomId }` | Avatar sale de una sala |

### Eventos de Sistema

| Evento | Dirección | Payload | Descripción |
|--------|-----------|---------|-------------|
| `error` | Servidor → Cliente | `{ message }` | Error en el servidor |
| `disconnect` | Automático | — | Cliente desconectado |

---

## Flujo de conexión detallado

```
1. Usuario autenticado en Clerk → obtiene JWT con getToken()

2. Frontend inicializa socket:
   socket = io(URL, { auth: { token: JWT } })

3. Servidor verifica JWT:
   io.use((socket, next) => {
     verifyClerkToken(socket.handshake.auth.token)
     → ok: socket.data.clerkId = userId, next()
     → fail: next(new Error('Unauthorized'))
   })

4. Conexión establecida → cliente emite 'user:connect' con datos de perfil

5. Servidor hace upsert del usuario en PostgreSQL (crea si no existe, actualiza si existe)

6. Servidor añade socket al room 'room:lobby' (sala por defecto)

7. Servidor emite 'presence:update' con la lista actual de usuarios online → todos los clientes actualizan su UI

8. Cuando el usuario cierra la pestaña → 'disconnect' automático
   → setUserOffline() en BD
   → nuevo 'presence:update' a todos
```

---

## Rooms de Socket.io

Los rooms de Socket.io son grupos de sockets. Un evento emitido a un room llega a todos sus miembros.

```typescript
// Unir a un room
socket.join('room:lobby')

// Emitir solo a una sala
io.to('room:meeting-1').emit('chat:message:broadcast', message)

// Emitir a todos excepto el emisor
socket.to('room:lobby').emit('presence:update', users)

// Emitir a absolutamente todos
io.emit('presence:update', users)
```

**Convención de nombres de rooms:**
- Salas de oficina: `room:{slug}` → `room:lobby`, `room:meeting-1`
- Canales privados: `private:{userId1}-{userId2}`

---

## Manejo de reconexión

Socket.io reconecta automáticamente, pero necesitamos re-emitir `user:connect` después de cada reconexión:

```typescript
// frontend/src/hooks/useSocket.ts
socket.on('connect', () => {
  // Re-registrar presencia después de reconexión
  socket.emit('user:connect', userProfile)
})

socket.on('disconnect', (reason) => {
  // Si el servidor desconectó activamente, no reconectar automáticamente
  if (reason === 'io server disconnect') {
    socket.connect()
  }
  // Para otros motivos, Socket.io reconecta solo
})
```

---

## Performance considerations

- **Throttling de movimiento**: el evento `player:move` se emite máximo cada 50ms (20fps), no en cada frame de Phaser (60fps).
- **Presencia optimizada**: `presence:update` envía la lista completa, no diffs. Aceptable para equipos < 200 personas. Para escalar: enviar solo el delta.
- **Rooms de Socket.io**: cada usuario solo recibe eventos de su sala actual, no de toda la oficina. Esto reduce el tráfico significativamente.

---

## Archivos del sistema realtime

```
backend/src/socket/
├── index.ts                    ← crea el servidor Socket.io, middleware de auth, registra handlers
├── handlers/
│   ├── presence.handler.ts     ← user:connect, user:status, disconnect
│   ├── chat.handler.ts         ← chat:message, chat:typing
│   └── movement.handler.ts     ← player:move (Fase 4)

frontend/src/
├── lib/socket.ts               ← singleton del cliente Socket.io
├── hooks/
│   ├── useSocket.ts            ← gestión del ciclo de vida de la conexión
│   └── usePresence.ts          ← suscripción a eventos de presencia
└── store/office.store.ts       ← estado global (onlineUsers, messages, etc.)
```
