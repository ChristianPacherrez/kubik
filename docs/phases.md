# Plan de Fases - Kubik

Cada fase construye sobre la anterior. Al final de cada fase, el proyecto debe ser deployable y funcional (aunque incompleto).

---

## Fase 1: Arquitectura Base ✅

**Objetivo**: Tener el esqueleto del proyecto listo para desarrollar.

### Entregables
- [x] Estructura de directorios del monorepo
- [x] Backend Express + TypeScript configurado
- [x] Frontend Next.js 14 + TypeScript + TailwindCSS configurado
- [x] Schema de Prisma con modelos base
- [x] Scripts de setup y desarrollo
- [x] Documentación inicial

### Criterio de Éxito
Ambos servidores corren sin errores. La base de datos se puede migrar y seedear.

---

## Fase 2: Autenticación con Clerk

**Objetivo**: Los usuarios pueden registrarse, iniciar sesión y acceder a la oficina.

### Entregables
- [ ] Integración de Clerk en el frontend (ClerkProvider, Sign In, Sign Up)
- [ ] Páginas `/sign-in` y `/sign-up` funcionales
- [ ] Layout protegido para `/office` (redirect si no autenticado)
- [ ] Middleware de auth en el backend que verifica JWT de Clerk
- [ ] Webhook de Clerk para sincronizar usuarios a PostgreSQL
- [ ] Página de perfil básica

### Criterio de Éxito
Solo usuarios autenticados pueden acceder a `/office`. El backend rechaza requests sin token válido.

---

## Fase 3: Presencia en Tiempo Real

**Objetivo**: Los usuarios pueden verse mutuamente en línea con sus estados.

### Entregables
- [ ] Conexión Socket.io con autenticación JWT
- [ ] Handler `user:connect` — upsert de usuario, broadcast de presencia
- [ ] Handler `user:disconnect` — marcar offline, broadcast
- [ ] Handler `user:status` — cambiar estado (AVAILABLE, BUSY, IN_MEETING, AWAY)
- [ ] Componente `OnlineUsers` — lista de usuarios con indicadores de estado
- [ ] Componente `StatusSelector` — dropdown para cambiar estado propio
- [ ] Store de Zustand con estado de presencia

### Criterio de Éxito
Dos usuarios en distintas pestañas se ven mutuamente. Al cerrar una pestaña, el usuario aparece offline.

---

## Fase 4: Mapa Virtual con Phaser

**Objetivo**: Los usuarios tienen un avatar en un mapa 2D que pueden mover.

### Entregables
- [ ] Integración de Phaser.js en Next.js (dynamic import, no SSR)
- [ ] Tilemap base de la oficina (sala principal, salas privadas, zona de descanso)
- [ ] Sprite de avatar con animaciones (idle, caminar en 4 direcciones)
- [ ] Movimiento del avatar con teclado (WASD / flechas)
- [ ] Sincronización de posición via Socket.io (`player:move`)
- [ ] Ver avatares de otros usuarios moverse en tiempo real
- [ ] Detección de entrada a salas (colisión con zonas)

### Criterio de Éxito
Dos usuarios se ven moverse en el mapa en tiempo real. Entrar a una sala actualiza el estado del usuario.

---

## Fase 5: Chat en Tiempo Real

**Objetivo**: Los usuarios pueden chatear por sala y en mensajes directos.

### Entregables
- [ ] Chat global de la sala actual
- [ ] Componente `ChatPanel` con lista de mensajes e input
- [ ] Handler `chat:message` — broadcast al room de Socket.io
- [ ] Handler `chat:typing` — indicador de "escribiendo..."
- [ ] Persistencia de mensajes en PostgreSQL (modelo `Message`)
- [ ] Cargar historial de mensajes al entrar a una sala
- [ ] Notificaciones de nuevo mensaje cuando el chat está minimizado

### Criterio de Éxito
Dos usuarios en la misma sala pueden chatear. Los mensajes persisten al recargar.

---

## Fase 6: Salas de Reuniones

**Objetivo**: Los usuarios pueden entrar a salas de reuniones con capacidad limitada.

### Entregables
- [ ] Salas de reuniones con capacidad máxima configurable
- [ ] Bloqueo de entrada cuando la sala está llena
- [ ] Lista de participantes de la sala actual
- [ ] Estado `IN_MEETING` automático al entrar a una sala de reunión
- [ ] Indicador visual de salas ocupadas en el mapa
- [ ] Invitaciones a salas (notificación push en el cliente)

### Criterio de Éxito
No se puede entrar a una sala llena. El mapa muestra visualmente qué salas están ocupadas.

---

## Fase 7: Gamificación

**Objetivo**: Añadir elementos de juego que incentiven la interacción y el trabajo.

### Entregables
- [ ] Sistema de puntos (XP) por: conectarse, chatear, participar en reuniones
- [ ] Niveles de usuario con badges visuales en el avatar
- [ ] Leaderboard semanal de la oficina
- [ ] Logros (achievements): "Primera conexión", "100 mensajes", "10 reuniones", etc.
- [ ] Personalización de avatar (colores, accesorios desbloqueables)
- [ ] Notificaciones de logros en tiempo real

### Criterio de Éxito
Los usuarios acumulan XP visiblemente. El leaderboard muestra el top 10 de la semana.
