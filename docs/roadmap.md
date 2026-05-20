# Roadmap — Kubik

Mapa de ruta del proyecto. Cada fase tiene objetivos claros, entregables concretos y criterios de éxito medibles.

---

## Visión general

```
Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6 → Fase 7
  Base    Auth    Realtime   Mapa     Chat    Salas   Gamific.
  ✅       🔄       ⏳         ⏳        ⏳      ⏳       ⏳
```

---

## Fase 1 — Arquitectura Base ✅

**Objetivo:** Estructura profesional del proyecto que soporte el crecimiento.

**Entregables:**
- [x] Estructura de carpetas frontend y backend
- [x] TypeScript configurado en ambos lados
- [x] Express + Socket.io funcionando juntos en un servidor HTTP
- [x] Prisma ORM con modelos User, Room, UserRoom
- [x] Tailwind con paleta de colores Kubik
- [x] Componentes base: OnlineUsers, ChatPanel, StatusSelector, Avatar
- [x] Zustand store con estado global del cliente
- [x] Hooks: useSocket, usePresence
- [x] Scripts de setup y arranque
- [x] Documentación inicial (architecture.md, api.md, phases.md)
- [x] CLAUDE.md, project-rules.md

**Criterio de éxito:** El proyecto levanta sin errores. La estructura de archivos sigue clean architecture.

---

## Fase 2 — Autenticación con Clerk 🔄

**Objetivo:** Flujo completo de login corporativo, usuarios persistidos en BD.

**Entregables:**
- [ ] Cuenta de Clerk creada y configurada
- [ ] Variables de entorno de Clerk configuradas
- [ ] Página de sign-in y sign-up funcionando
- [ ] Middleware de Clerk en backend protegiendo rutas
- [ ] Webhook de Clerk → crear/actualizar usuario en PostgreSQL al registrarse
- [ ] Perfil del usuario visible en la oficina
- [ ] Roles asignables (HOST, ADMIN, COLLABORATOR)

**Criterio de éxito:** Un usuario puede registrarse, iniciar sesión y ver su perfil en la oficina. Los datos persisten en PostgreSQL.

**Archivos clave a crear/modificar:**
- `backend/src/webhook/clerk.webhook.ts`
- `frontend/src/app/(auth)/` — ya existe, solo configurar variables
- `backend/src/middleware/auth.middleware.ts` — ya existe

---

## Fase 3 — Presencia Realtime con Socket.io ⏳

**Objetivo:** Ver en tiempo real quién está online y su estado.

**Entregables:**
- [ ] Conexión Socket.io autenticada con JWT de Clerk
- [ ] Emit `user:connect` al entrar a la oficina
- [ ] Lista de usuarios online actualizada en tiempo real
- [ ] Cambio de estado (disponible, ocupado, en reunión, ausente)
- [ ] Indicador visual de desconexión/reconexión
- [ ] Broadcast de presencia a todos los clientes

**Criterio de éxito:** Abre dos ventanas del navegador. Cuando una se conecta, la otra ve el nuevo usuario aparecer. Cuando una cambia su estado, la otra lo refleja inmediatamente.

**Archivos clave:**
- `backend/src/socket/handlers/presence.handler.ts` — ya existe
- `frontend/src/hooks/usePresence.ts` — ya existe
- `frontend/src/components/office/OnlineUsers.tsx` — ya existe

---

## Fase 4 — Mapa Virtual con Phaser.js ⏳

**Objetivo:** Mapa 2D pixel art donde los avatares se mueven.

**Entregables:**
- [ ] Escena Phaser básica integrada en Next.js
- [ ] Tileset del mapa (lobby, escritorios, salas)
- [ ] Avatar del usuario con movimiento WASD/flechas
- [ ] Posición del avatar sincronizada via Socket.io
- [ ] Avatares de otros usuarios visibles en el mapa
- [ ] Colisiones básicas (no atravesar paredes)
- [ ] Cámaras que siguen al avatar

**Criterio de éxito:** El usuario puede moverse en el mapa con el teclado y ver a otros usuarios moverse en tiempo real.

**Archivos clave a crear:**
- `frontend/src/components/office/GameCanvas.tsx`
- `frontend/src/game/scenes/OfficeScene.ts`
- `frontend/src/game/config.ts`
- `backend/src/socket/handlers/movement.handler.ts`
- `assets/tilesets/office.png`

---

## Fase 5 — Chat Realtime ⏳

**Objetivo:** Chat funcional por sala con historial.

**Entregables:**
- [ ] Chat por sala (cada sala tiene su propio canal)
- [ ] Mensajes persistidos en PostgreSQL
- [ ] Historial al cargar la página (últimos 50 mensajes)
- [ ] Indicador de "escribiendo..."
- [ ] Notificaciones de nuevos mensajes en salas no activas
- [ ] Menciones @usuario

**Criterio de éxito:** Los mensajes se envían, persisten al recargar, y llegan en tiempo real a todos los usuarios de la sala.

**Archivos clave:**
- `backend/src/socket/handlers/chat.handler.ts` — ya existe (ampliar)
- `frontend/src/components/office/ChatPanel.tsx` — ya existe (ampliar)
- Nuevo modelo Prisma: `Message`

---

## Fase 6 — Salas Virtuales y Reuniones ⏳

**Objetivo:** Espacios separados con acceso controlado y base para videollamadas.

**Entregables:**
- [ ] Múltiples salas: Lobby, Sala de Reuniones, Foco, Descanso
- [ ] Entrar/salir de salas (cambia el room de Socket.io)
- [ ] Capacidad máxima por sala
- [ ] Indicador visual de ocupantes actuales por sala
- [ ] Integración base con Daily.co o LiveKit para videollamadas
- [ ] Botón "Iniciar reunión" en sala de reuniones

**Criterio de éxito:** El usuario puede navegar entre salas, cada sala tiene su propio chat, y se puede iniciar una videollamada básica.

---

## Fase 7 — Gamificación ⏳

**Objetivo:** Sistema de puntos, logros y personalización que mejora la retención.

**Entregables:**
- [ ] Sistema de puntos de experiencia (XP) por actividad
- [ ] Niveles de usuario
- [ ] Logros desbloqueables (primer mensaje, primera reunión, etc.)
- [ ] Personalización de avatar (color, accesorios)
- [ ] Leaderboard del equipo
- [ ] Animaciones de avatar (idle, caminar, saludar)
- [ ] Efectos visuales en el mapa (día/noche, decoraciones)

---

## Consideraciones futuras (post-MVP)

- Integración con Slack/Teams para notificaciones
- App móvil (React Native)
- Whiteboard colaborativo en salas de reuniones
- Integraciones con herramientas de productividad (Jira, Linear)
- Analytics de uso del espacio de trabajo
- SSO empresarial (SAML)
