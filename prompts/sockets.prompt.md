# Prompt — Sistema Realtime con Socket.io

Usa este prompt cuando trabajes en la Fase 3 del proyecto Kubik.

---

## Contexto del proyecto

Estoy construyendo Kubik, una oficina virtual gamificada.
Stack: Next.js 14, TypeScript, Express, Socket.io, PostgreSQL (Prisma), Clerk Auth.
Proyecto en `~/Documents/claude/projects/kubik`. Lee `CLAUDE.md` para arquitectura completa.

## Lo que necesito implementar

[DESCRIBE AQUÍ LO QUE NECESITAS]

Ejemplos:
- "Necesito que el evento user:connect haga upsert del usuario y emita la lista de online a todos"
- "Necesito implementar el indicador de typing en el chat"
- "Necesito que la reconexión automática re-emita la presencia del usuario"

## Arquitectura del sistema realtime

```
frontend/src/lib/socket.ts          ← singleton del cliente Socket.io
frontend/src/hooks/useSocket.ts     ← hook que gestiona ciclo de vida
frontend/src/hooks/usePresence.ts   ← hook que escucha presence:update
frontend/src/store/office.store.ts  ← Zustand store (onlineUsers, messages)

backend/src/socket/index.ts                      ← servidor + middleware de auth
backend/src/socket/handlers/presence.handler.ts  ← user:connect, user:status, disconnect
backend/src/socket/handlers/chat.handler.ts      ← chat:message, chat:typing
```

## Eventos tipados (usar siempre el enum, nunca strings)

```typescript
// backend/src/types/index.ts y frontend/src/types/index.ts
enum SocketEvents {
  USER_CONNECT = 'user:connect',
  USER_STATUS = 'user:status',
  PRESENCE_UPDATE = 'presence:update',
  CHAT_MESSAGE = 'chat:message',
  CHAT_MESSAGE_BROADCAST = 'chat:message:broadcast',
  CHAT_TYPING = 'chat:typing',
  CHAT_TYPING_BROADCAST = 'chat:typing:broadcast',
  PLAYER_MOVE = 'player:move',
  PLAYER_MOVE_BROADCAST = 'player:move:broadcast',
}
```

## Reglas importantes

- El JWT de Clerk va en `socket.handshake.auth.token` — verificarlo en middleware.
- `socket.data.clerkId` y `socket.data.userId` se guardan en el handshake para uso en handlers.
- Rooms de Socket.io siguen la convención `room:{slug}` (ej: `room:lobby`).
- El movimiento de avatar se throttlea a 50ms (20fps) antes de emitir.
- `io.emit()` envía a todos. `socket.to('room:x').emit()` envía a la sala excepto el emisor.
