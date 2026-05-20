# Mecánicas de Juego — Kubik

Cómo funciona la parte "game" del proyecto: mapa pixel art, avatares, movimiento y gamificación.

---

## ¿Por qué Phaser.js?

Phaser es el motor de juego 2D más popular para navegadores. Las razones de elegirlo:

1. **Canvas / WebGL** — renderiza mapas pixel art eficientemente.
2. **Tilemaps integrados** — carga mapas creados en Tiled sin trabajo extra.
3. **Input management** — teclado y gamepad listos para usar.
4. **TypeScript** — soporte nativo.
5. **Comunidad grande** — muchos recursos y ejemplos.

---

## Integración Phaser + Next.js

Phaser necesita un elemento `<canvas>` del DOM. En Next.js hay que tener cuidado porque el servidor no tiene DOM.

```typescript
// frontend/src/components/office/GameCanvas.tsx
'use client'  // ← obligatorio, Phaser solo funciona en el cliente

import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { OfficeScene } from '@/game/scenes/OfficeScene'

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    // Inicializar Phaser solo en el cliente, después del primer render
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,  // WebGL si está disponible, Canvas como fallback
      parent: containerRef.current,
      width: '100%',
      height: '100%',
      scene: [OfficeScene],
      pixelArt: true,     // preserva el estilo pixel art (sin anti-aliasing)
      backgroundColor: '#1a1a2e',
    })

    return () => {
      // Destruir Phaser al desmontar el componente
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
```

---

## Estructura de escenas Phaser

```
frontend/src/game/
├── config.ts              ← configuración del juego Phaser
├── scenes/
│   ├── PreloadScene.ts    ← carga todos los assets (tilesets, sprites)
│   ├── OfficeScene.ts     ← escena principal del mapa de la oficina
│   └── UIScene.ts         ← HUD superpuesto (nombre de usuario, etc.)
└── objects/
    ├── Player.ts          ← clase del avatar del usuario local
    └── RemotePlayer.ts    ← clase para avatares de otros usuarios
```

---

## Mapa pixel art con Tiled

El mapa se crea en **Tiled Map Editor** (gratuito) y se exporta en formato JSON.

### Estructura del mapa

```
Capas del mapa (de abajo a arriba):
1. ground         ← suelo (tiles de piso)
2. walls          ← paredes (con colisiones)
3. furniture      ← escritorios, sillas, objetos
4. overhead       ← objetos que van por encima del avatar
5. collisions     ← capa invisible de colisiones (definida con propiedades)
6. spawn-points   ← puntos de aparición de avatares
```

### Cargar el mapa en Phaser

```typescript
// PreloadScene.ts
this.load.tilemapTiledJSON('office', '/assets/maps/office.json')
this.load.image('tileset-office', '/assets/tilesets/office.png')
this.load.spritesheet('avatar', '/assets/sprites/avatar.png', {
  frameWidth: 32,
  frameHeight: 48,
})

// OfficeScene.ts
const map = this.make.tilemap({ key: 'office' })
const tileset = map.addTilesetImage('office-tiles', 'tileset-office')
const groundLayer = map.createLayer('ground', tileset)
const wallLayer = map.createLayer('walls', tileset)
wallLayer.setCollisionByProperty({ collides: true })
```

---

## Sistema de movimiento

### El avatar del jugador local

```typescript
// frontend/src/game/objects/Player.ts

// Velocidad de movimiento en píxeles por segundo
const SPEED = 120

// En update() de la escena:
if (cursors.left.isDown) {
  player.setVelocityX(-SPEED)
  player.anims.play('walk-left', true)
} else if (cursors.right.isDown) {
  player.setVelocityX(SPEED)
  player.anims.play('walk-right', true)
}
// ... etc

// Emitir posición al servidor (throttleado a 20fps máximo)
const now = Date.now()
if (now - lastEmit > 50) {
  socket.emit('player:move', { x: player.x, y: player.y, direction })
  lastEmit = now
}
```

### Avatares de otros jugadores

```typescript
// frontend/src/game/objects/RemotePlayer.ts

// Se crea cuando llega 'presence:update' con un usuario nuevo
// Se destruye cuando ese usuario se desconecta
// Se mueve con tweens (interpolación suave) cuando llega 'player:move:broadcast'

socket.on('player:move:broadcast', ({ userId, x, y }) => {
  const remotePlayer = remotePlayers.get(userId)
  if (!remotePlayer) return

  // Tween para que el movimiento sea fluido, no teletransporte
  this.tweens.add({
    targets: remotePlayer.sprite,
    x, y,
    duration: 100,  // 100ms de interpolación
    ease: 'Linear',
  })
})
```

---

## Sprite sheet del avatar

```
Formato recomendado: 32x48 píxeles por frame

Fila 0: walk-down   (3 frames: izquierda-pié, centro, derecha-pié)
Fila 1: walk-left   (3 frames)
Fila 2: walk-right  (3 frames)
Fila 3: walk-up     (3 frames)
Fila 4: idle-down   (1 frame)
Fila 5: idle-left   (1 frame)
Fila 6: idle-right  (1 frame)
Fila 7: idle-up     (1 frame)
```

Assets pixel art gratuitos recomendados:
- [LPC Spritesheet](https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles) — OpenGameArt
- [Kenney Assets](https://kenney.nl/assets) — Kenney.nl (dominio público)
- [itch.io](https://itch.io/game-assets/free/tag-pixel-art) — muchos packs gratuitos

---

## Sistema de gamificación (Fase 7)

### Puntos de experiencia (XP)

| Acción | XP ganados |
|--------|-----------|
| Primer login del día | +50 XP |
| Enviar un mensaje | +5 XP |
| Participar en una reunión | +100 XP |
| Estar online 1 hora | +20 XP |
| Completar perfil | +200 XP |
| Recibir una mención | +10 XP |

### Niveles

```
Nivel 1:   0 - 500 XP      → "Rookie"
Nivel 2:   500 - 1500 XP   → "Colaborador"
Nivel 3:   1500 - 3500 XP  → "Veterano"
Nivel 4:   3500 - 7000 XP  → "Experto"
Nivel 5:   7000+ XP        → "Leyenda"
```

### Logros

```typescript
// Ejemplos de logros (achievements)
const ACHIEVEMENTS = [
  { id: 'first_message', name: 'Primer mensaje', xp: 50 },
  { id: 'first_meeting', name: 'Primera reunión', xp: 100 },
  { id: 'social_butterfly', name: '10 mensajes en un día', xp: 75 },
  { id: 'early_bird', name: 'Conectado antes de las 8am', xp: 50 },
  { id: 'team_player', name: 'Invitó a 5 personas', xp: 200 },
]
```

---

## Assets necesarios

Los assets van en `/assets/`:

```
assets/
├── maps/
│   └── office.json          ← mapa exportado desde Tiled
├── tilesets/
│   └── office.png           ← tileset principal
├── sprites/
│   ├── avatar-default.png   ← sprite sheet del avatar por defecto
│   └── avatars/             ← variantes de avatar
├── ui/
│   └── status-icons.png     ← iconos de estado (disponible, ocupado, etc.)
└── fonts/
    └── pixel-font.ttf       ← fuente pixel art para el mapa
```
