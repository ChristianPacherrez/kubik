// office-geometry.ts — Fuente de verdad de toda la geometría espacial de Kubik
//
// Arquitectura "canvas-first":
//   · Rooms, corridors, furniture y zones viven aquí como datos tipados
//   · canvas-office.ts lee esto para dibujar el mundo
//   · movement.ts usa ROOMS para detectar la zona del jugador
//   · collision.ts usará COLLISION_RECTS para AABB (próxima fase)
//
// Sistema de coordenadas: px en el espacio del mundo (origin = top-left)
// World: WORLD_W × WORLD_H
//
//  Layout (top-down):
//
//  ┌─────────────────────────────── LOBBY / RECEPTION ────────────────────────┐ y:0–272
//  ├────────────────────────────── H1 CORRIDOR ───────────────────────────────┤ y:272–336
//  │           │V1│              │V2│  MTG-A   │V3│                          │
//  │  ENG      │  │  FOCUS ZONE  │  │──────────│  │  LOUNGE                 │ y:336–776
//  │           │  │              │  │  MTG-B   │  │                          │
//  ├────────────────────────────── H2 CORRIDOR ───────────────────────────────┤ y:776–840
//  │       CAFETERIA              │       COLLAB SPACE                        │ y:840–1280
//  └──────────────────────────────────────────────────────────────────────────┘

// ─── Dimensiones del mundo ────────────────────────────────────────────────────
// Suma columnas: 496 + 64 + 368 + 64 + 336 + 64 + 528 = 1920 ✓
// Suma filas:    272 + 64 + 440 + 64 + 440             = 1280 ✓

export const WORLD_W = 1920
export const WORLD_H = 1280

// Grosor visual del muro entre salas (no hay zona walkable entre estos valores)
export const WALL_THICKNESS = 10

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface OfficeRoom {
  id:          string
  label:       string
  x:           number
  y:           number
  w:           number
  h:           number
  floorColor:  string   // color base del suelo (dark mode)
  accentColor: string   // color de brillo ambiental, zona UI, etc.
  /** Qué edges están ABIERTOS (dan a un corredor — sin muro visual) */
  openEdges?: Array<'top' | 'bottom' | 'left' | 'right'>
}

export interface OfficeCorridor {
  x: number; y: number; w: number; h: number
}

export interface FurniturePiece {
  type:
    | 'desk'
    | 'monitor'
    | 'chair'
    | 'sofa'
    | 'sofa-h'       // sofa horizontal (más ancho que alto)
    | 'round-table'
    | 'conf-table'   // conference table (rectangular)
    | 'plant'
    | 'rug'
    | 'counter'
    | 'shelf'
    | 'whiteboard'
    | 'coffee-table'
    | 'locker'
  x:  number
  y:  number
  w:  number
  h:  number
  /** Color override — si no se pasa, usa el default del tipo */
  color?: string
}

// ─── Pasillos ─────────────────────────────────────────────────────────────────

export const CORRIDORS: OfficeCorridor[] = [
  { x: 0,    y: 272, w: 1920, h: 64  },  // H1 — entre lobby y salas
  { x: 0,    y: 776, w: 1920, h: 64  },  // H2 — entre salas y planta baja
  { x: 496,  y: 272, w: 64,   h: 568 },  // V1 — entre ENG y FOCUS
  { x: 928,  y: 272, w: 64,   h: 568 },  // V2 — entre FOCUS y MEETING
  { x: 1328, y: 272, w: 64,   h: 568 },  // V3 — entre MEETING y LOUNGE
]

// ─── Salas ────────────────────────────────────────────────────────────────────

export const ROOMS: OfficeRoom[] = [
  // ── Lobby ──────────────────────────────────────────────────────────────────
  {
    id:          'lobby',
    label:       'Reception',
    x: 0,   y: 0,   w: 1920, h: 272,
    floorColor:  '#30303E',   // lobby: violeta-gris oscuro, ~20% luminosidad
    accentColor: '#8B5CF6',
    openEdges:   ['bottom'],
  },

  // ── Engineering ────────────────────────────────────────────────────────────
  {
    id:          'engineering',
    label:       'Engineering',
    x: 0,   y: 336, w: 496, h: 440,
    floorColor:  '#2C3838',   // engineering: teal-gris oscuro
    accentColor: '#14B8A6',
    openEdges:   ['top', 'right', 'bottom'],
  },

  // ── Focus Zone ─────────────────────────────────────────────────────────────
  {
    id:          'focus',
    label:       'Focus Zone',
    x: 560, y: 336, w: 368, h: 440,
    floorColor:  '#2C3044',   // focus: azul-gris oscuro
    accentColor: '#60A5FA',
    openEdges:   ['top', 'left', 'right', 'bottom'],
  },

  // ── Meeting A ──────────────────────────────────────────────────────────────
  {
    id:          'meeting-a',
    label:       'Meeting A',
    x: 992, y: 336, w: 336, h: 220,
    floorColor:  '#3C3430',   // meeting-a: ámbar-gris cálido oscuro
    accentColor: '#F97316',
    openEdges:   ['top', 'left', 'right'],
  },

  // ── Meeting B ──────────────────────────────────────────────────────────────
  {
    id:          'meeting-b',
    label:       'Meeting B',
    x: 992, y: 556, w: 336, h: 220,
    floorColor:  '#34303E',   // meeting-b: violeta-gris oscuro
    accentColor: '#C084FC',
    openEdges:   ['left', 'right', 'bottom'],
  },

  // ── Lounge ─────────────────────────────────────────────────────────────────
  {
    id:          'lounge',
    label:       'Lounge',
    x: 1392, y: 336, w: 528, h: 440,
    floorColor:  '#3A3428',   // lounge: ámbar-gris cálido oscuro
    accentColor: '#F59E0B',
    openEdges:   ['top', 'left', 'bottom'],
  },

  // ── Cafeteria ──────────────────────────────────────────────────────────────
  {
    id:          'cafeteria',
    label:       'Cafeteria',
    x: 0,   y: 840, w: 992, h: 440,
    floorColor:  '#2C3A36',   // cafeteria: verde-gris oscuro
    accentColor: '#34D399',
    openEdges:   ['top', 'right'],
  },

  // ── Collab Space ───────────────────────────────────────────────────────────
  {
    id:          'collab',
    label:       'Collab',
    x: 992, y: 840, w: 928, h: 440,
    floorColor:  '#2E2E40',   // collab: índigo-gris oscuro
    accentColor: '#818CF8',
    openEdges:   ['top', 'left'],
  },
]

// ─── Muebles por sala ────────────────────────────────────────────────────────
// Coordenadas absolutas en el espacio del mundo.

export const FURNITURE: Record<string, FurniturePiece[]> = {

  // ── Lobby ──────────────────────────────────────────────────────────────────
  lobby: [
    // Rug central
    { type: 'rug',          x: 660,  y: 60,   w: 600, h: 140 },
    // Reception desk — forma de arco/L, dos piezas
    { type: 'conf-table',   x: 820,  y: 188,  w: 280, h: 52  },
    // Sofas — cluster izquierdo
    { type: 'sofa-h',       x: 90,   y: 80,   w: 160, h: 52  },
    { type: 'sofa',         x: 90,   y: 80,   w: 52,  h: 100 },
    { type: 'coffee-table', x: 190,  y: 122,  w: 56,  h: 36  },
    // Sofas — cluster derecho
    { type: 'sofa-h',       x: 1670, y: 80,   w: 160, h: 52  },
    { type: 'sofa',         x: 1778, y: 80,   w: 52,  h: 100 },
    { type: 'coffee-table', x: 1674, y: 122,  w: 56,  h: 36  },
    // Plantas lobby (esquinas + centro)
    { type: 'plant',        x: 24,   y: 20,   w: 36,  h: 36  },
    { type: 'plant',        x: 1860, y: 20,   w: 36,  h: 36  },
    { type: 'plant',        x: 24,   y: 210,  w: 36,  h: 36  },
    { type: 'plant',        x: 1860, y: 210,  w: 36,  h: 36  },
    { type: 'plant',        x: 940,  y: 20,   w: 36,  h: 36  },
    // Chairs de recepción
    { type: 'chair',        x: 888,  y: 148,  w: 28,  h: 28  },
    { type: 'chair',        x: 980,  y: 148,  w: 28,  h: 28  },
    { type: 'chair',        x: 1072, y: 148,  w: 28,  h: 28  },
  ],

  // ── Engineering ────────────────────────────────────────────────────────────
  engineering: [
    // Fila A — 3 workstations, y≈370
    { type: 'desk',   x: 32,  y: 370, w: 88, h: 44 },
    { type: 'desk',   x: 152, y: 370, w: 88, h: 44 },
    { type: 'desk',   x: 272, y: 370, w: 88, h: 44 },
    { type: 'chair',  x: 68,  y: 420, w: 24, h: 24 },
    { type: 'chair',  x: 188, y: 420, w: 24, h: 24 },
    { type: 'chair',  x: 308, y: 420, w: 24, h: 24 },
    // Fila B — 3 workstations, y≈480
    { type: 'desk',   x: 32,  y: 490, w: 88, h: 44 },
    { type: 'desk',   x: 152, y: 490, w: 88, h: 44 },
    { type: 'desk',   x: 272, y: 490, w: 88, h: 44 },
    { type: 'chair',  x: 68,  y: 540, w: 24, h: 24 },
    { type: 'chair',  x: 188, y: 540, w: 24, h: 24 },
    { type: 'chair',  x: 308, y: 540, w: 24, h: 24 },
    // Fila C — 2 workstations, y≈610
    { type: 'desk',   x: 32,  y: 620, w: 88, h: 44 },
    { type: 'desk',   x: 152, y: 620, w: 88, h: 44 },
    { type: 'chair',  x: 68,  y: 670, w: 24, h: 24 },
    { type: 'chair',  x: 188, y: 670, w: 24, h: 24 },
    // Shelf en pared derecha
    { type: 'shelf',  x: 444, y: 360, w: 20, h: 180 },
    // Plantas
    { type: 'plant',  x: 420, y: 710, w: 32, h: 32  },
    { type: 'plant',  x: 420, y: 350, w: 32, h: 32  },
  ],

  // ── Focus Zone ─────────────────────────────────────────────────────────────
  focus: [
    // 6 pods individuales (2 columnas)
    { type: 'desk',  x: 592,  y: 362, w: 76, h: 40 },
    { type: 'chair', x: 614,  y: 406, w: 24, h: 24 },
    { type: 'desk',  x: 702,  y: 362, w: 76, h: 40 },
    { type: 'chair', x: 724,  y: 406, w: 24, h: 24 },

    { type: 'desk',  x: 592,  y: 470, w: 76, h: 40 },
    { type: 'chair', x: 614,  y: 514, w: 24, h: 24 },
    { type: 'desk',  x: 702,  y: 470, w: 76, h: 40 },
    { type: 'chair', x: 724,  y: 514, w: 24, h: 24 },

    { type: 'desk',  x: 592,  y: 580, w: 76, h: 40 },
    { type: 'chair', x: 614,  y: 624, w: 24, h: 24 },
    { type: 'desk',  x: 702,  y: 580, w: 76, h: 40 },
    { type: 'chair', x: 724,  y: 624, w: 24, h: 24 },

    // Divisores entre pods (lockers cortos)
    { type: 'locker', x: 560, y: 440, w: 20, h: 40 },
    { type: 'locker', x: 560, y: 550, w: 20, h: 40 },
    // Plantas
    { type: 'plant', x: 572,  y: 348, w: 30, h: 30 },
    { type: 'plant', x: 860,  y: 740, w: 30, h: 30 },
  ],

  // ── Meeting A ──────────────────────────────────────────────────────────────
  'meeting-a': [
    // Mesa central redonda
    { type: 'round-table', x: 1100, y: 420,  w: 104, h: 104 },
    // 6 sillas alrededor (offset desde centro en radio ~74px)
    { type: 'chair', x: 1143, y: 348, w: 24, h: 24 },  // top
    { type: 'chair', x: 1143, y: 504, w: 24, h: 24 },  // bottom
    { type: 'chair', x: 1044, y: 396, w: 24, h: 24 },  // top-left
    { type: 'chair', x: 1044, y: 452, w: 24, h: 24 },  // bottom-left
    { type: 'chair', x: 1240, y: 396, w: 24, h: 24 },  // top-right
    { type: 'chair', x: 1240, y: 452, w: 24, h: 24 },  // bottom-right
    // Planta en esquina
    { type: 'plant', x: 1002, y: 348, w: 28, h: 28 },
  ],

  // ── Meeting B ──────────────────────────────────────────────────────────────
  'meeting-b': [
    // Mesa de conferencias rectangular
    { type: 'conf-table', x: 1048, y: 610, w: 212, h: 76 },
    // Sillas: 3 arriba, 3 abajo, 1 cada lado
    { type: 'chair', x: 1058, y: 574, w: 22, h: 22 },
    { type: 'chair', x: 1145, y: 574, w: 22, h: 22 },
    { type: 'chair', x: 1232, y: 574, w: 22, h: 22 },
    { type: 'chair', x: 1058, y: 698, w: 22, h: 22 },
    { type: 'chair', x: 1145, y: 698, w: 22, h: 22 },
    { type: 'chair', x: 1232, y: 698, w: 22, h: 22 },
    { type: 'chair', x: 1012, y: 638, w: 22, h: 22 },
    { type: 'chair', x: 1274, y: 638, w: 22, h: 22 },
    // Whiteboard en pared
    { type: 'whiteboard', x: 1000, y: 558, w: 12, h: 100 },
    // Planta
    { type: 'plant', x: 1290, y: 558, w: 26, h: 26 },
  ],

  // ── Lounge ─────────────────────────────────────────────────────────────────
  lounge: [
    // Cluster A — área izquierda
    { type: 'rug',          x: 1420, y: 358, w: 220, h: 160 },
    { type: 'sofa-h',       x: 1430, y: 368, w: 180, h: 50  },
    { type: 'sofa',         x: 1430, y: 368, w: 50,  h: 120 },
    { type: 'sofa',         x: 1590, y: 368, w: 50,  h: 120 },
    { type: 'coffee-table', x: 1492, y: 438, w: 72,  h: 44  },
    // Cluster B — área derecha
    { type: 'rug',          x: 1660, y: 450, w: 220, h: 150 },
    { type: 'sofa-h',       x: 1670, y: 568, w: 180, h: 50  },
    { type: 'sofa',         x: 1670, y: 460, w: 50,  h: 110 },
    { type: 'sofa',         x: 1830, y: 460, w: 50,  h: 110 },
    { type: 'coffee-table', x: 1736, y: 508, w: 60,  h: 40  },
    // Plantas
    { type: 'plant', x: 1400, y: 344, w: 32, h: 32 },
    { type: 'plant', x: 1876, y: 344, w: 32, h: 32 },
    { type: 'plant', x: 1876, y: 720, w: 32, h: 32 },
    { type: 'plant', x: 1400, y: 720, w: 32, h: 32 },
  ],

  // ── Cafeteria ──────────────────────────────────────────────────────────────
  cafeteria: [
    // Counter a lo largo de la pared superior
    { type: 'counter', x: 0,   y: 840, w: 900, h: 36 },
    // Mesas redondas con sillas (3×2 grid)
    { type: 'round-table', x: 72,  y: 940, w: 88, h: 88 },
    { type: 'chair', x: 96,  y: 896, w: 22, h: 22 },
    { type: 'chair', x: 96,  y: 1042,w: 22, h: 22 },
    { type: 'chair', x: 42,  y: 968, w: 22, h: 22 },
    { type: 'chair', x: 152, y: 968, w: 22, h: 22 },

    { type: 'round-table', x: 240, y: 940, w: 88, h: 88 },
    { type: 'chair', x: 264, y: 896, w: 22, h: 22 },
    { type: 'chair', x: 264, y: 1042,w: 22, h: 22 },
    { type: 'chair', x: 212, y: 968, w: 22, h: 22 },
    { type: 'chair', x: 320, y: 968, w: 22, h: 22 },

    { type: 'round-table', x: 408, y: 940, w: 88, h: 88 },
    { type: 'chair', x: 432, y: 896, w: 22, h: 22 },
    { type: 'chair', x: 432, y: 1042,w: 22, h: 22 },
    { type: 'chair', x: 380, y: 968, w: 22, h: 22 },
    { type: 'chair', x: 488, y: 968, w: 22, h: 22 },

    { type: 'round-table', x: 128, y: 1102,w: 88, h: 88 },
    { type: 'chair', x: 152, y: 1058,w: 22, h: 22 },
    { type: 'chair', x: 152, y: 1204,w: 22, h: 22 },
    { type: 'chair', x: 100, y: 1130,w: 22, h: 22 },
    { type: 'chair', x: 208, y: 1130,w: 22, h: 22 },

    { type: 'round-table', x: 296, y: 1102,w: 88, h: 88 },
    { type: 'chair', x: 320, y: 1058,w: 22, h: 22 },
    { type: 'chair', x: 320, y: 1204,w: 22, h: 22 },
    { type: 'chair', x: 268, y: 1130,w: 22, h: 22 },
    { type: 'chair', x: 376, y: 1130,w: 22, h: 22 },
    // Plantas en esquinas
    { type: 'plant', x: 576, y: 852, w: 32, h: 32 },
    { type: 'plant', x: 576, y: 1218,w: 32, h: 32 },
    { type: 'plant', x: 900, y: 852, w: 32, h: 32 },
    { type: 'plant', x: 900, y: 1218,w: 32, h: 32 },
  ],

  // ── Collab ─────────────────────────────────────────────────────────────────
  collab: [
    // Whiteboards en pared izquierda
    { type: 'whiteboard', x: 992, y: 860,  w: 14, h: 120 },
    { type: 'whiteboard', x: 992, y: 998,  w: 14, h: 120 },
    // Mesa cluster central (4 escritorios en isla)
    { type: 'desk',   x: 1068, y: 888,  w: 84, h: 44 },
    { type: 'desk',   x: 1196, y: 888,  w: 84, h: 44 },
    { type: 'desk',   x: 1068, y: 980,  w: 84, h: 44 },
    { type: 'desk',   x: 1196, y: 980,  w: 84, h: 44 },
    { type: 'chair',  x: 1098, y: 938,  w: 24, h: 24 },
    { type: 'chair',  x: 1226, y: 938,  w: 24, h: 24 },
    { type: 'chair',  x: 1098, y: 940,  w: 24, h: 24 },
    { type: 'chair',  x: 1226, y: 940,  w: 24, h: 24 },
    // Área lounge — sofas
    { type: 'rug',    x: 1460, y: 970,  w: 400, h: 220 },
    { type: 'sofa-h', x: 1470, y: 980,  w: 360, h: 50  },
    { type: 'sofa',   x: 1470, y: 980,  w: 50,  h: 180 },
    { type: 'sofa',   x: 1790, y: 980,  w: 50,  h: 180 },
    { type: 'coffee-table', x: 1570, y: 1070, w: 120, h: 52 },
    // Plantas
    { type: 'plant', x: 1880, y: 852,  w: 30, h: 30 },
    { type: 'plant', x: 1880, y: 1218, w: 30, h: 30 },
    { type: 'plant', x: 1004, y: 1218, w: 30, h: 30 },
  ],
}

// ─── Zona detection (para useMovement) ───────────────────────────────────────

/** Margen de zona: el centro del avatar debe estar N px dentro de la sala */
export const ZONE_MARGIN = 16

/** Devuelve el id de la sala en la que está el punto, o null si está en corredor */
export function detectZoneAtPoint(x: number, y: number): string | null {
  const room = ROOMS.find(
    (r) =>
      x >= r.x + ZONE_MARGIN &&
      x <= r.x + r.w - ZONE_MARGIN &&
      y >= r.y + ZONE_MARGIN &&
      y <= r.y + r.h - ZONE_MARGIN,
  )
  return room?.id ?? null
}

// ─── Player defaults ──────────────────────────────────────────────────────────

/** Punto de spawn del jugador — centro del lobby, zona cómoda */
export const PLAYER_START_X = 960
export const PLAYER_START_Y = 160

/** Límites de movimiento — evita salir del mundo */
export const MOVEMENT_BOUNDS = {
  minX: 16,
  maxX: WORLD_W - 16,
  minY: 16,
  maxY: WORLD_H - 16,
}

/** Posiciones de NPCs en el mundo nuevo */
export const NPC_POSITIONS: Record<string, { x: number; y: number }> = {
  '2': { x: 260,  y: 180  },  // Ana Torres   — Lobby (izq)
  '3': { x: 1155, y: 450  },  // Miguel        — Meeting A
  '4': { x: 1560, y: 140  },  // Sofia Ruiz    — Lobby (der)
  '5': { x: 744,  y: 560  },  // Diego Mendoza — Focus
  '6': { x: 220,  y: 590  },  // Valeria Chen  — Engineering
}
