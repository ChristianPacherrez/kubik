# Prompt — Phaser.js y Mapa Pixel Art

Usa este prompt cuando trabajes en el motor de juego y el mapa 2D de Kubik.

---

## Contexto del proyecto

Estoy construyendo Kubik, una oficina virtual gamificada.
Stack: Next.js 14, TypeScript, Phaser.js 3.60, Socket.io.
Proyecto en `~/Documents/claude/projects/kubik`. Lee `CLAUDE.md` para arquitectura completa.

## Lo que necesito implementar

[DESCRIBE AQUÍ LO QUE NECESITAS]

Ejemplos:
- "Necesito crear la escena PreloadScene que cargue todos los assets"
- "Necesito implementar colisiones con las paredes del tilemap"
- "Necesito crear las animaciones del avatar (walk, idle)"
- "Necesito integrar el canvas de Phaser como componente React"

## Configuración de Phaser en este proyecto

```typescript
// frontend/src/game/config.ts
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  pixelArt: true,        // preserva los píxeles nítidos
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',   // física simple, suficiente para movimiento top-down
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [PreloadScene, OfficeScene],
}
```

## Estructura de escenas

```
PreloadScene → OfficeScene (→ UIScene si se necesita HUD)
```

**PreloadScene:**
```typescript
preload() {
  this.load.tilemapTiledJSON('office', '/assets/maps/office.json')
  this.load.image('tileset-office', '/assets/tilesets/office.png')
  this.load.spritesheet('avatar', '/assets/sprites/avatar-default.png', {
    frameWidth: 32, frameHeight: 48
  })
}
create() {
  this.scene.start('OfficeScene')
}
```

**OfficeScene — estructura mínima:**
```typescript
create() {
  // 1. Crear tilemap
  // 2. Crear capas (ground, walls, furniture, overhead)
  // 3. Configurar colisiones en capa walls
  // 4. Crear Player en spawn point
  // 5. Configurar cámara (followPlayer, setBounds)
  // 6. Crear cursors (WASD + flechas)
  // 7. Registrar listeners de socket para RemotePlayers
}

update() {
  // Mover Player según input
  // Throttle: emitir posición a Socket.io máximo cada 50ms
}
```

## Reglas importantes

- **SIEMPRE** `'use client'` en `GameCanvas.tsx`.
- Inicializar `new Phaser.Game()` dentro de `useEffect`, destruir en cleanup.
- No importar Phaser en componentes Server — causará error de build.
- `pixelArt: true` es crítico para la estética — sin esto los sprites se ven borrosos.
- El acceso al socket dentro de escenas Phaser: pasarlo via `this.registry` o via módulo externo.
- Para el mapa usar **Tiled Map Editor** (gratuito en tiled.mapeditor.org).
- Exportar el mapa desde Tiled como JSON (File → Export As → JSON map files).

## Dimensiones recomendadas

```
Tile size: 32x32 píxeles
Map size: 40x30 tiles = 1280x960 píxeles
Avatar sprite: 32x48 píxeles
Viewport: tamaño del contenedor (100% del área central)
```

## Animaciones del avatar

```typescript
// Crear animaciones en create() de PreloadScene o OfficeScene
this.anims.create({
  key: 'walk-down',
  frames: this.anims.generateFrameNumbers('avatar', { start: 0, end: 2 }),
  frameRate: 8,
  repeat: -1,
})
// Repetir para: walk-left, walk-right, walk-up, idle-down, idle-left, idle-right, idle-up
```
