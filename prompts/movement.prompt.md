# Prompt — Movimiento de Avatares (Fase 4)

Usa este prompt cuando trabajes en el movimiento realtime de avatares con Phaser.js.

---

## Contexto del proyecto

Estoy construyendo Kubik, una oficina virtual gamificada.
Stack: Next.js 14, TypeScript, Phaser.js 3, Socket.io, Express, PostgreSQL.
Proyecto en `~/Documents/claude/projects/kubik`. Lee `CLAUDE.md` para arquitectura completa.

## Lo que necesito implementar

[DESCRIBE AQUÍ LO QUE NECESITAS]

Ejemplos:
- "Necesito integrar Phaser.js como componente React en la página de la oficina"
- "Necesito implementar el movimiento WASD del avatar con colisiones"
- "Necesito que las posiciones de los otros avatares se sincronicen via Socket.io"
- "Necesito cargar el tilemap JSON exportado desde Tiled"

## Lo que ya existe

- `frontend/src/app/(office)/office/page.tsx` — página de la oficina (placeholder del canvas)
- `frontend/src/hooks/useSocket.ts` — conexión Socket.io activa
- `frontend/src/store/office.store.ts` — Zustand con `onlineUsers`
- `backend/src/socket/handlers/presence.handler.ts` — maneja conexión/desconexión

## Arquitectura de Phaser en Next.js

```
frontend/src/
├── components/office/GameCanvas.tsx   ← componente React que monta Phaser
└── game/
    ├── config.ts                      ← configuración de Phaser.Game
    ├── scenes/
    │   ├── PreloadScene.ts            ← carga assets
    │   └── OfficeScene.ts             ← escena principal
    └── objects/
        ├── Player.ts                  ← avatar del usuario local
        └── RemotePlayer.ts            ← avatares de otros usuarios
```

## Reglas importantes

- `GameCanvas.tsx` DEBE tener `'use client'` — Phaser solo funciona en el navegador.
- Inicializar Phaser dentro de `useEffect` con verificación de `typeof window`.
- Destruir el juego en el cleanup del `useEffect` para evitar memory leaks.
- El movimiento se throttlea: emitir `player:move` máximo cada 50ms.
- Usar Phaser tweens para interpolar el movimiento de avatares remotos.
- `pixelArt: true` en la config de Phaser para preservar el estilo pixel art.
- El socket se accede dentro de Phaser via el store de Zustand o pasándolo como referencia.

## Assets requeridos

```
assets/
├── maps/office.json            ← exportar desde Tiled Map Editor
├── tilesets/office.png         ← tileset del mapa
└── sprites/avatar-default.png  ← spritesheet 32x48px, 4 direcciones x 3 frames
```

## Evento de movimiento

```typescript
// Emitir (frontend)
socket.emit('player:move', { x: player.x, y: player.y, direction: 'down' })

// Recibir y sincronizar (frontend — otros jugadores)
socket.on('player:move:broadcast', ({ userId, x, y, direction }) => {
  // mover RemotePlayer con tween
})

// Backend handler: relay a todos en la sala excepto el emisor
socket.to(socket.data.currentRoom).emit('player:move:broadcast', {
  userId: socket.data.userId, x, y, direction
})
```
