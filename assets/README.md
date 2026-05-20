# Assets de Kubik

Este directorio contiene los recursos gráficos compartidos del proyecto.

## Estructura

```
assets/
├── tilesets/          # Tilesets para el mapa de la oficina (formato .png + .json de Tiled)
├── sprites/           # Sprites de avatares y objetos
│   ├── characters/    # Personajes con animaciones (idle, walk en 4 direcciones)
│   └── objects/       # Objetos del mapa (escritorios, sillas, plantas, etc.)
├── ui/                # Iconos y elementos de UI pixel art
└── maps/              # Archivos .json exportados desde Tiled Map Editor
```

## Formato Recomendado

### Tilesets
- Formato: PNG con fondo transparente
- Tamaño de tile: **16x16 px** o **32x32 px** (elegir uno y ser consistente)
- Nombre: `office_tileset.png` + `office_tileset.json` (para metadatos de Tiled)

### Sprites de personajes
- Formato: PNG con spritesheet
- Animaciones requeridas:
  - `idle_down` — 4 frames
  - `idle_up` — 4 frames
  - `idle_left` / `idle_right` — 4 frames
  - `walk_down` — 8 frames
  - `walk_up` — 8 frames
  - `walk_left` / `walk_right` — 8 frames
- Tamaño por frame: **16x32 px** (personaje más alto que ancho para vista top-down)

### Mapas
- Herramienta: [Tiled Map Editor](https://www.mapeditor.org/) (gratis)
- Exportar como JSON (formato compatible con Phaser)
- Capas recomendadas:
  - `floor` — suelo base
  - `walls` — paredes y obstáculos (con propiedad `collides: true`)
  - `furniture` — muebles encima del suelo
  - `zones` — zonas interactivas invisibles (puertas de salas, triggers)

## Fuentes de Assets Gratuitos

- [itch.io — pixel art assets](https://itch.io/game-assets/tag-pixel-art/tag-top-down)
- [Kenney.nl](https://kenney.nl/assets) — assets de alta calidad en dominio público
- [OpenGameArt.org](https://opengameart.org/) — assets con licencias abiertas

## Uso en Phaser

```typescript
// Cargar un tileset en Phaser
this.load.image('office_tiles', '/assets/tilesets/office_tileset.png')
this.load.tilemapTiledJSON('office_map', '/assets/maps/office.json')

// Cargar un spritesheet de personaje
this.load.spritesheet('character', '/assets/sprites/characters/default.png', {
  frameWidth: 16,
  frameHeight: 32,
})
```

Los archivos en este directorio deben copiarse a `frontend/public/assets/` para que
Next.js los sirva estáticamente. El directorio `assets/` raíz es el "master" de los
recursos; `frontend/public/assets/` es la copia deployada.
