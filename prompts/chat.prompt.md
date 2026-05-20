# Prompt — Chat Realtime (Fase 5)

Usa este prompt cuando trabajes en el sistema de chat de Kubik.

---

## Contexto del proyecto

Estoy construyendo Kubik, una oficina virtual gamificada.
Stack: Next.js 14, TypeScript, Socket.io, Express, PostgreSQL (Prisma), Clerk Auth.
Proyecto en `~/Documents/claude/projects/kubik`. Lee `CLAUDE.md` para arquitectura completa.

## Lo que necesito implementar

[DESCRIBE AQUÍ LO QUE NECESITAS]

Ejemplos:
- "Necesito persistir los mensajes en PostgreSQL y cargar el historial al entrar a la sala"
- "Necesito implementar las menciones @usuario en el chat"
- "Necesito notificaciones de mensajes en salas que no estoy viendo"

## Lo que ya existe

- `backend/src/socket/handlers/chat.handler.ts` — handler básico (chat:message, chat:typing)
- `frontend/src/components/office/ChatPanel.tsx` — UI del chat (mensaje, input, typing)
- `frontend/src/store/office.store.ts` — `messages` array en el store (capped a 100)

## Modelo de datos relevante

```prisma
model Message {
  id        String   @id @default(cuid())
  content   String
  userId    String
  roomId    String
  createdAt DateTime @default(now())

  user      User     @relation(...)
  room      Room     @relation(...)

  @@index([roomId, createdAt])
}
```

## Flujo del chat

```
1. Usuario envía mensaje → socket.emit('chat:message', { roomId, content })
2. Backend persiste en PostgreSQL
3. Backend emite 'chat:message:broadcast' a la sala
4. Todos los clientes de la sala reciben el mensaje y lo agregan al store
5. ChatPanel re-renderiza con el nuevo mensaje
6. Auto-scroll al último mensaje
```

## Historial al cargar la sala

```typescript
// Al conectarse a una sala, el cliente pide los últimos N mensajes
// Opción A: REST API GET /api/rooms/:slug/messages
// Opción B: socket.emit('room:join', { roomId }) → servidor responde con historial
```

## Reglas importantes

- Los mensajes se guardan en BD (no son efímeros como el movimiento).
- El chat es por sala — un usuario en Lobby no ve mensajes de Meeting.
- Limitar historial inicial a 50 mensajes (query con `take: 50, orderBy: { createdAt: 'desc' }`).
- El indicador de typing NO se persiste — es efímero, solo va por Socket.io.
- Sanitizar el contenido del mensaje antes de guardar (evitar XSS).
- Máximo 1000 caracteres por mensaje.
