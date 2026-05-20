// canvas-office.ts — Motor de renderizado Canvas 2D para la oficina espacial de Kubik
//
// Environmental Polish Pass — dual palette (light/dark), sistema de iluminación real,
// variantes de material de suelo, profundidad de muebles, legibilidad espacial.
//
// Orden de dibujado (painter's algorithm):
//   1. Background (void / muro exterior)
//   2. Corridor floors + textura
//   3. Room floors + material (stone / carpet / wood / tile)
//   4. Wall strips + inner highlight
//   5. Corridor center lines
//   6. Furniture (rugs primero, luego volúmenes)
//   7. Corridor path lights (dark only)
//   8. Monitor glows (screen composite)
//   9. Ceiling lights (dark) / window light (light)
//  10. Ambient room glow (accent color, screen)
//  11. Room labels (pill con borde de acento)
//  12. World vignette

import { WORLD_W, WORLD_H, ROOMS, CORRIDORS, FURNITURE, FurniturePiece, OfficeRoom } from './office-geometry'

// ─── Tipos de paleta ──────────────────────────────────────────────────────────

interface FurniturePalette {
  desk:           string
  deskEdge:       string
  deskHighlight:  string
  monitor:        string
  monitorGlow:    string
  chair:          string
  chairEdge:      string
  sofa:           string
  sofaEdge:       string
  sofaCushion:    string
  table:          string
  tableEdge:      string
  plant:          string
  plantAccent:    string
  plantDot:       string
  pot:            string
  rug:            string
  rugBorder:      string
  whiteboard:     string
  whiteboardFg:   string
  whiteboardLine: string
  shelf:          string
  shelfEdge:      string
  counter:        string
  counterEdge:    string
  counterTop:     string
  locker:         string
  lockerEdge:     string
}

interface OfficePalette {
  void:          string
  corridor:      string
  wallStrip:     string
  wallHighlight: string
  furniture:     FurniturePalette
  label:         string
  labelBg:       string
  dotGrid:       string   // carpet / generic dot grid
  lineGrid:      string   // tile / wood grain lines
}

// ─── Paleta DARK ─────────────────────────────────────────────────────────────
// Modern night office — tonos gris-azul oscuros (~20% luminosidad), neutros.
// La base es lo suficientemente clara para leer detalle sin focos teatrales.
// Referencia: Discord dark, VS Code dark, Gather Town night.

const DARK: OfficePalette = {
  // Exterior (sólo se ve en bordes del mundo)
  void:          '#1C1B26',   // gris-azul muy oscuro, igual que --map-bg
  // Pasillos — ligeramente más claro que void, legibles sin focos
  corridor:      '#282738',   // gris-azul-índigo medio-oscuro
  // Muros — más oscuros que el suelo de sala, crean separación clara
  wallStrip:     '#16151E',
  wallHighlight: '#34334A',

  furniture: {
    // Madera: tonos neutros-oscuros (gris-castaño), no marrones cálidos
    desk:           '#4A4456',
    deskEdge:       '#5C566A',
    deskHighlight:  '#66607A',
    // Monitor: dark, high contrast
    monitor:        '#14151E',
    monitorGlow:    'rgba(56,189,248,0.55)',
    // Silla: gris medio
    chair:          '#504A5E',
    chairEdge:      '#62596E',
    // Sofá: el naranja es un acento visual fuerte, funciona bien en dark
    sofa:           '#7A3E1A',
    sofaEdge:       '#8A4E22',
    sofaCushion:    'rgba(255,255,255,0.08)',
    // Mesa: gris-oscuro neutro
    table:          '#40404E',
    tableEdge:      '#505062',
    // Planta: verde apagado nocturno
    plant:          '#264836',
    plantAccent:    '#346648',
    plantDot:       'rgba(255,255,255,0.12)',
    pot:            '#5A3E2A',
    // Alfombra: violeta oscuro, integrado
    rug:            'rgba(124,58,237,0.14)',
    rugBorder:      'rgba(124,58,237,0.28)',
    // Pizarra: gris-azul oscuro
    whiteboard:     '#2E3048',
    whiteboardFg:   '#383A58',
    whiteboardLine: 'rgba(148,163,184,0.18)',
    // Estantería / mostrador: gris-oscuro
    shelf:          '#3A384A',
    shelfEdge:      '#4A4860',
    counter:        '#363444',
    counterEdge:    '#464460',
    counterTop:     '#3E3C50',
    // Casillero: gris-azul frío
    locker:         '#2E3448',
    lockerEdge:     '#3E4460',
  },

  label:    'rgba(255,255,255,0.28)',
  labelBg:  'rgba(20,19,30,0.85)',
  // Texturas más visibles porque la base es más clara
  dotGrid:  'rgba(255,255,255,0.06)',
  lineGrid: 'rgba(255,255,255,0.038)',
}

// ─── Paleta LIGHT ────────────────────────────────────────────────────────────
// Warm daytime office — Gather Town-inspired beige/cream, orange sofas, wood furniture.

const LIGHT: OfficePalette = {
  void:          '#EAE4D9',   // warm beige — corridor/wall background
  corridor:      '#DED8CC',   // slightly darker beige for corridor floors
  wallStrip:     '#C2BAA8',   // medium warm beige for walls
  wallHighlight: '#EDE8DE',   // lighter warm highlight

  furniture: {
    desk:           '#D4B87A',  // warm honey/wood
    deskEdge:       '#B89A58',  // darker wood edge
    deskHighlight:  '#E8CC8E',  // light wood top surface
    monitor:        '#2A2E42',  // dark monitor (high contrast)
    monitorGlow:    'rgba(56,189,248,0.32)',
    chair:          '#B8A890',  // warm linen/fabric chair
    chairEdge:      '#A09080',
    sofa:           '#E07B45',  // ORANGE — Gather signature color
    sofaEdge:       '#C86A34',
    sofaCushion:    'rgba(255,255,255,0.14)',
    table:          '#E8D8A8',  // light warm wood table
    tableEdge:      '#C8B880',
    plant:          '#3D9E67',  // vibrant green
    plantAccent:    '#52C880',  // lighter green highlight
    plantDot:       'rgba(255,255,255,0.32)',
    pot:            '#C4855A',  // terracotta
    rug:            'rgba(124,58,237,0.11)',
    rugBorder:      'rgba(124,58,237,0.24)',
    whiteboard:     '#FFFFFF',  // pure white whiteboard
    whiteboardFg:   '#F8F8F8',
    whiteboardLine: 'rgba(100,116,139,0.18)',
    shelf:          '#C4A87A',  // wood shelf
    shelfEdge:      '#A88C5A',
    counter:        '#D8C890',  // counter wood
    counterEdge:    '#B8A870',
    counterTop:     '#C8B47C',
    locker:         '#9AABB8',  // blue-gray locker
    lockerEdge:     '#7A8E9C',
  },

  label:    'rgba(16,24,40,0.75)',
  labelBg:  'rgba(255,255,255,0.90)',
  dotGrid:  'rgba(0,0,0,0.048)',
  lineGrid: 'rgba(0,0,0,0.030)',
}

// Light-mode floor color per room (overrides OfficeRoom.floorColor which is dark-only)
const LIGHT_FLOORS: Record<string, string> = {
  'lobby':       '#EDE9FF',   // soft lavender — welcoming entrance
  'engineering': '#E2F4F0',   // soft teal — focused tech
  'focus':       '#E8F0FC',   // soft sky blue — calm concentration
  'meeting-a':   '#FFF2E8',   // warm peach — collaborative warmth
  'meeting-b':   '#F8F0FF',   // soft purple — creative meetings
  'lounge':      '#FFF8EB',   // warm amber — relaxed social
  'cafeteria':   '#E8F9F0',   // fresh mint green — energetic social
  'collab':      '#EDEAFF',   // soft violet — creative collaboration
}

// ─── Paleta activa (module-level) ─────────────────────────────────────────────
// Actualizada por drawOfficeWorld() antes de cada dibujo.

let P: OfficePalette       = DARK
let currentTheme: 'dark' | 'light' = 'dark'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Rounded rect path — reemplaza canvas.roundRect() para compat. */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const minR = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + minR, y)
  ctx.lineTo(x + w - minR, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + minR)
  ctx.lineTo(x + w, y + h - minR)
  ctx.quadraticCurveTo(x + w, y + h, x + w - minR, y + h)
  ctx.lineTo(x + minR, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - minR)
  ctx.lineTo(x, y + minR)
  ctx.quadraticCurveTo(x, y, x + minR, y)
  ctx.closePath()
}

function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor   = 'transparent'
  ctx.shadowBlur    = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Sombra de volumen — en dark la base es más clara ahora, sombra ligeramente visible */
function sh(): string {
  return currentTheme === 'dark' ? 'rgba(0,0,0,0.32)' : 'rgba(0,0,0,0.17)'
}

// ─── Fondo ────────────────────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = P.void
  ctx.fillRect(0, 0, WORLD_W, WORLD_H)
}

// ─── Pasillos ────────────────────────────────────────────────────────────────

function drawCorridors(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = P.corridor
  for (const c of CORRIDORS) {
    ctx.fillRect(c.x, c.y, c.w, c.h)
  }
  // Textura sutil sobre pasillos (dot grid)
  for (const c of CORRIDORS) {
    drawDotGrid(ctx, c.x, c.y, c.w, c.h, P.dotGrid, 24)
  }
}

// ─── Suelos ───────────────────────────────────────────────────────────────────

function drawRoomFloor(ctx: CanvasRenderingContext2D, room: OfficeRoom) {
  const floorColor = currentTheme === 'light'
    ? (LIGHT_FLOORS[room.id] ?? room.floorColor)
    : room.floorColor

  ctx.fillStyle = floorColor
  ctx.fillRect(room.x, room.y, room.w, room.h)

  // Material de suelo específico por sala
  drawFloorTexture(ctx, room)
}

function drawFloorTexture(ctx: CanvasRenderingContext2D, room: OfficeRoom) {
  switch (room.id) {
    case 'lobby':
      // Piedra — cuadrícula grande
      drawTileGrid(ctx, room.x, room.y, room.w, room.h, P.lineGrid, 64)
      break
    case 'cafeteria':
      // Baldosa de cocina — cuadrícula mediana
      drawTileGrid(ctx, room.x, room.y, room.w, room.h, P.lineGrid, 36)
      break
    case 'lounge':
      // Madera — vetas horizontales
      drawWoodGrain(ctx, room.x, room.y, room.w, room.h, P.lineGrid)
      break
    default:
      // Moqueta — dot grid tupido
      drawDotGrid(ctx, room.x, room.y, room.w, room.h, P.dotGrid, 16)
  }
}

function drawDotGrid(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
  spacing: number,
) {
  ctx.fillStyle = color
  const startX = Math.ceil(x / spacing) * spacing
  const startY = Math.ceil(y / spacing) * spacing
  for (let gx = startX; gx < x + w; gx += spacing) {
    for (let gy = startY; gy < y + h; gy += spacing) {
      ctx.beginPath()
      ctx.arc(gx, gy, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawTileGrid(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
  tileSize: number,
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth   = 1
  const startX = Math.floor(x / tileSize) * tileSize
  const startY = Math.floor(y / tileSize) * tileSize
  ctx.beginPath()
  for (let gx = startX; gx <= x + w; gx += tileSize) {
    ctx.moveTo(gx, y); ctx.lineTo(gx, y + h)
  }
  for (let gy = startY; gy <= y + h; gy += tileSize) {
    ctx.moveTo(x, gy); ctx.lineTo(x + w, gy)
  }
  ctx.stroke()
  ctx.restore()
}

function drawWoodGrain(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth   = 1
  ctx.beginPath()
  for (let gy = y + 8; gy < y + h; gy += 8) {
    ctx.moveTo(x + 2, gy); ctx.lineTo(x + w - 2, gy)
  }
  ctx.stroke()
  ctx.restore()
}

// ─── Muros ────────────────────────────────────────────────────────────────────

const WALL_W = 8

function drawWalls(ctx: CanvasRenderingContext2D) {
  for (const room of ROOMS) {
    const open = new Set(room.openEdges ?? [])
    const { x, y, w, h } = room
    ctx.fillStyle = P.wallStrip

    if (!open.has('top'))    ctx.fillRect(x,           y,           w, WALL_W)
    if (!open.has('bottom')) ctx.fillRect(x,           y + h - WALL_W, w, WALL_W)
    if (!open.has('left'))   ctx.fillRect(x,           y,           WALL_W, h)
    if (!open.has('right'))  ctx.fillRect(x + w - WALL_W, y,        WALL_W, h)

    // Borde interior — profundidad
    ctx.strokeStyle = P.wallHighlight
    ctx.lineWidth   = 1
    ctx.strokeRect(x + WALL_W + 0.5, y + WALL_W + 0.5, w - WALL_W * 2 - 1, h - WALL_W * 2 - 1)
  }

  // ── Muro interno MTG-A / MTG-B (pared horizontal compartida) ──────────────
  ctx.fillStyle = P.wallStrip
  ctx.fillRect(992, 556 - WALL_W / 2, 336, WALL_W)
  // Hueco de puerta central (64px)
  const mtgAColor = currentTheme === 'light'
    ? (LIGHT_FLOORS['meeting-a'] ?? ROOMS.find((r) => r.id === 'meeting-a')!.floorColor)
    : ROOMS.find((r) => r.id === 'meeting-a')!.floorColor
  ctx.fillStyle = mtgAColor
  ctx.fillRect(992 + 136, 556 - WALL_W / 2, 64, WALL_W)

  // ── Muro interno CAFETERIA / COLLAB (pared vertical compartida) ───────────
  ctx.fillStyle = P.wallStrip
  ctx.fillRect(992 - WALL_W / 2, 840, WALL_W, 440)
  // Hueco de puerta central (64px)
  const cafeColor = currentTheme === 'light'
    ? (LIGHT_FLOORS['cafeteria'] ?? ROOMS.find((r) => r.id === 'cafeteria')!.floorColor)
    : ROOMS.find((r) => r.id === 'cafeteria')!.floorColor
  ctx.fillStyle = cafeColor
  ctx.fillRect(992 - WALL_W / 2, 840 + 190, WALL_W, 64)

  // ── Marco exterior del mundo ───────────────────────────────────────────────
  ctx.fillStyle = P.void
  ctx.fillRect(0,              0,              WORLD_W, WALL_W)
  ctx.fillRect(0,              WORLD_H - WALL_W, WORLD_W, WALL_W)
  ctx.fillRect(0,              0,              WALL_W,  WORLD_H)
  ctx.fillRect(WORLD_W - WALL_W, 0,            WALL_W,  WORLD_H)
}

// ─── Líneas de corredor ───────────────────────────────────────────────────────

function drawCorridorCenterLines(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.strokeStyle = currentTheme === 'dark'
    ? 'rgba(255,255,255,0.022)'
    : 'rgba(0,0,0,0.036)'
  ctx.lineWidth = 1
  ctx.setLineDash([12, 18])

  for (const c of CORRIDORS) {
    const isH = c.w > c.h
    if (isH) {
      const y = c.y + c.h / 2
      ctx.beginPath(); ctx.moveTo(c.x + 20, y); ctx.lineTo(c.x + c.w - 20, y); ctx.stroke()
    } else {
      const x = c.x + c.w / 2
      ctx.beginPath(); ctx.moveTo(x, c.y + 20); ctx.lineTo(x, c.y + c.h - 20); ctx.stroke()
    }
  }

  ctx.setLineDash([])
  ctx.restore()
}

// ─── Muebles ──────────────────────────────────────────────────────────────────

function drawDesk(ctx: CanvasRenderingContext2D, p: FurniturePiece) {
  const { x, y, w, h } = p
  // Sombra de volumen
  ctx.fillStyle = sh()
  ctx.fillRect(x + 2, y + 3, w, h)
  // Superficie
  ctx.fillStyle = P.furniture.desk
  rr(ctx, x, y, w, h, 3); ctx.fill()
  // Edge highlight (fuente de luz desde arriba-izquierda)
  ctx.strokeStyle = P.furniture.deskHighlight
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + 3, y + h - 2)
  ctx.lineTo(x + 3, y + 3)
  ctx.lineTo(x + w - 2, y + 3)
  ctx.stroke()
  // Borde exterior
  ctx.strokeStyle = P.furniture.deskEdge
  ctx.lineWidth   = 1
  rr(ctx, x, y, w, h, 3); ctx.stroke()
  // Monitor — panel en la parte superior del escritorio
  const mw = Math.min(w * 0.52, 44)
  const mh = 22
  const mx = x + (w - mw) / 2
  const my = y + 5
  ctx.fillStyle = P.furniture.monitor
  ctx.fillRect(mx, my, mw, mh)
  // Screen glow
  ctx.fillStyle = P.furniture.monitorGlow
  ctx.fillRect(mx + 2, my + 2, mw - 4, mh - 4)
  // Glare (esquina superior izquierda de la pantalla)
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  ctx.fillRect(mx + 2, my + 2, mw * 0.35, 3)
}

function drawChair(ctx: CanvasRenderingContext2D, p: FurniturePiece) {
  const { x, y, w, h } = p
  ctx.fillStyle = sh()
  ctx.fillRect(x + 1, y + 2, w, h)
  ctx.fillStyle = P.furniture.chair
  rr(ctx, x, y, w, h, 4); ctx.fill()
  // Seat highlight
  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  rr(ctx, x + 2, y + 2, w - 4, h / 2.5, 3); ctx.fill()
  ctx.strokeStyle = P.furniture.chairEdge
  ctx.lineWidth   = 1
  rr(ctx, x, y, w, h, 4); ctx.stroke()
}

function drawSofa(ctx: CanvasRenderingContext2D, p: FurniturePiece, horizontal: boolean) {
  const { x, y, w, h } = p
  ctx.fillStyle = sh()
  ctx.fillRect(x + 2, y + 3, w, h)
  ctx.fillStyle = P.furniture.sofa
  rr(ctx, x, y, w, h, 5); ctx.fill()
  // Top surface highlight
  ctx.fillStyle = 'rgba(255,255,255,0.055)'
  rr(ctx, x + 2, y + 2, w - 4, h * 0.3, 4); ctx.fill()
  ctx.strokeStyle = P.furniture.sofaEdge
  ctx.lineWidth   = 1
  rr(ctx, x, y, w, h, 5); ctx.stroke()
  // Cushion dividers
  if (horizontal) {
    const n = Math.max(2, Math.floor(w / 56))
    for (let i = 1; i < n; i++) {
      const cx = x + (w / n) * i
      ctx.beginPath(); ctx.moveTo(cx, y + 6); ctx.lineTo(cx, y + h - 6)
      ctx.strokeStyle = P.furniture.sofaCushion; ctx.lineWidth = 1.5; ctx.stroke()
    }
  } else {
    const n = Math.max(2, Math.floor(h / 56))
    for (let i = 1; i < n; i++) {
      const cy = y + (h / n) * i
      ctx.beginPath(); ctx.moveTo(x + 6, cy); ctx.lineTo(x + w - 6, cy)
      ctx.strokeStyle = P.furniture.sofaCushion; ctx.lineWidth = 1.5; ctx.stroke()
    }
  }
}

function drawRoundTable(ctx: CanvasRenderingContext2D, p: FurniturePiece) {
  const cx = p.x + p.w / 2
  const cy = p.y + p.h / 2
  const r  = Math.min(p.w, p.h) / 2
  ctx.fillStyle = sh()
  ctx.beginPath(); ctx.arc(cx + 2, cy + 3, r, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = P.furniture.table
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  // Top-left highlight (simula luz overhead)
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  ctx.beginPath(); ctx.arc(cx - r * 0.22, cy - r * 0.28, r * 0.52, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = P.furniture.tableEdge
  ctx.lineWidth   = 1.5
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
  // Centro decorativo
  ctx.fillStyle = P.furniture.tableEdge
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2); ctx.fill()
}

function drawConfTable(ctx: CanvasRenderingContext2D, p: FurniturePiece) {
  const { x, y, w, h } = p
  ctx.fillStyle = sh()
  ctx.fillRect(x + 2, y + 3, w, h)
  ctx.fillStyle = P.furniture.table
  rr(ctx, x, y, w, h, 6); ctx.fill()
  // Surface highlight
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  rr(ctx, x + 2, y + 2, w - 4, h * 0.28, 5); ctx.fill()
  ctx.strokeStyle = P.furniture.tableEdge
  ctx.lineWidth   = 1.5
  rr(ctx, x, y, w, h, 6); ctx.stroke()
}

function drawPlant(ctx: CanvasRenderingContext2D, p: FurniturePiece) {
  const cx = p.x + p.w / 2
  const cy = p.y + p.h / 2
  const r  = p.w / 2
  // Sombra base
  ctx.fillStyle = sh()
  ctx.beginPath(); ctx.arc(cx + 1, cy + 2, r * 0.62, 0, Math.PI * 2); ctx.fill()
  // Maceta
  ctx.fillStyle = P.furniture.pot
  ctx.fillRect(cx - r * 0.42, cy + r * 0.12, r * 0.84, r * 0.65)
  // Maceta highlight
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  ctx.fillRect(cx - r * 0.32, cy + r * 0.14, r * 0.18, r * 0.48)
  // Follaje oscuro (base)
  ctx.fillStyle = P.furniture.plant
  ctx.beginPath(); ctx.arc(cx, cy - r * 0.1, r * 0.80, 0, Math.PI * 2); ctx.fill()
  // Follaje claro (highlight offset)
  ctx.fillStyle = P.furniture.plantAccent
  ctx.beginPath(); ctx.arc(cx - r * 0.2, cy - r * 0.3, r * 0.54, 0, Math.PI * 2); ctx.fill()
  // Specular
  ctx.fillStyle = P.furniture.plantDot
  ctx.beginPath(); ctx.arc(cx - r * 0.32, cy - r * 0.42, r * 0.20, 0, Math.PI * 2); ctx.fill()
}

function drawRug(ctx: CanvasRenderingContext2D, p: FurniturePiece) {
  ctx.fillStyle = P.furniture.rug
  rr(ctx, p.x, p.y, p.w, p.h, 10); ctx.fill()
  // Borde interior
  ctx.strokeStyle = P.furniture.rugBorder
  ctx.lineWidth   = 1.5
  rr(ctx, p.x + 6, p.y + 6, p.w - 12, p.h - 12, 7); ctx.stroke()
  // Borde decorativo interior (más pequeño)
  ctx.strokeStyle = P.furniture.rug
  ctx.lineWidth   = 1
  rr(ctx, p.x + 11, p.y + 11, p.w - 22, p.h - 22, 5); ctx.stroke()
}

function drawCoffeeTable(ctx: CanvasRenderingContext2D, p: FurniturePiece) {
  const { x, y, w, h } = p
  ctx.fillStyle = sh()
  ctx.fillRect(x + 2, y + 2, w, h)
  ctx.fillStyle = P.furniture.table
  rr(ctx, x, y, w, h, 4); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  rr(ctx, x + 2, y + 2, w - 4, h * 0.35, 3); ctx.fill()
  ctx.strokeStyle = P.furniture.tableEdge
  ctx.lineWidth   = 1
  rr(ctx, x, y, w, h, 4); ctx.stroke()
}

function drawWhiteboard(ctx: CanvasRenderingContext2D, p: FurniturePiece) {
  const { x, y, w, h } = p
  ctx.fillStyle = P.furniture.whiteboard
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = P.furniture.whiteboardFg
  ctx.fillRect(x + 2, y + 4, w - 4, h - 8)
  // Líneas de escritura
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = P.furniture.whiteboardLine
    ctx.fillRect(x + 3, y + 12 + i * (h - 16) / 4, w - 6, 1.5)
  }
  // Gleam (borde superior)
  ctx.fillStyle = 'rgba(255,255,255,0.09)'
  ctx.fillRect(x + 2, y + 4, w - 4, 3)
}

function drawCounter(ctx: CanvasRenderingContext2D, p: FurniturePiece) {
  const { x, y, w, h } = p
  ctx.fillStyle = sh()
  ctx.fillRect(x + 2, y + 3, w, h)
  ctx.fillStyle = P.furniture.counter
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = P.furniture.counterEdge
  ctx.lineWidth   = 1
  ctx.strokeRect(x, y, w, h)
  // Barra de mostrador (superficie frontal)
  ctx.fillStyle = P.furniture.counterTop
  ctx.fillRect(x, y + h - 7, w, 7)
  // Top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fillRect(x + 1, y + 1, w - 2, 4)
}

function drawShelf(ctx: CanvasRenderingContext2D, p: FurniturePiece) {
  const { x, y, w, h } = p
  ctx.fillStyle = P.furniture.shelf
  ctx.fillRect(x, y, w, h)
  // Estantes horizontales
  const shelves = Math.max(2, Math.floor(h / 40))
  for (let i = 0; i <= shelves; i++) {
    ctx.fillStyle = P.furniture.shelfEdge
    ctx.fillRect(x, y + Math.round(i * (h / shelves)), w, 2)
  }
  // Libros decorativos (solo en estantes anchos)
  if (w > 16) {
    const bookColors = ['#4a80a0', '#a05050', '#50a070', '#a07030', '#7050a0']
    let bx = x + 2
    let row = 0
    const shelfH = Math.round(h / shelves)
    while (row < shelves && row < 3) {
      const bw  = 4 + ((bx * 7 + row * 13) % 8)
      const bh  = shelfH - 5
      const by  = y + row * shelfH + 2
      ctx.fillStyle  = bookColors[(Math.round(bx + row)) % bookColors.length]
      ctx.globalAlpha = 0.36
      ctx.fillRect(bx, by, bw, bh)
      ctx.globalAlpha = 1
      bx += bw + 1
      if (bx >= x + w - 4) { bx = x + 2; row++ }
    }
  }
}

function drawLocker(ctx: CanvasRenderingContext2D, p: FurniturePiece) {
  const { x, y, w, h } = p
  ctx.fillStyle = P.furniture.locker
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = P.furniture.lockerEdge
  ctx.lineWidth   = 1
  ctx.strokeRect(x, y, w, h)
  // Divisor de puerta horizontal
  if (h > 40) {
    ctx.fillStyle = P.furniture.lockerEdge
    ctx.fillRect(x, y + Math.round(h / 2), w, 1)
  }
  // Manillas (puntos)
  ctx.fillStyle = P.furniture.lockerEdge
  ctx.beginPath(); ctx.arc(x + w - 4, y + h * 0.25, 1.5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(x + w - 4, y + h * 0.75, 1.5, 0, Math.PI * 2); ctx.fill()
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

function drawFurniturePiece(ctx: CanvasRenderingContext2D, p: FurniturePiece) {
  ctx.save()
  switch (p.type) {
    case 'desk':         drawDesk(ctx, p);               break
    case 'chair':        drawChair(ctx, p);              break
    case 'sofa':         drawSofa(ctx, p, false);        break
    case 'sofa-h':       drawSofa(ctx, p, true);         break
    case 'round-table':  drawRoundTable(ctx, p);         break
    case 'conf-table':   drawConfTable(ctx, p);          break
    // 'plant' omitido — WorldSceneLayer (SVG animado) es el owner de plantas
    // case 'plant': drawPlant(ctx, p); break
    case 'rug':          drawRug(ctx, p);                break
    case 'coffee-table': drawCoffeeTable(ctx, p);        break
    case 'whiteboard':   drawWhiteboard(ctx, p);         break
    case 'counter':      drawCounter(ctx, p);            break
    case 'shelf':        drawShelf(ctx, p);              break
    case 'locker':       drawLocker(ctx, p);             break
  }
  ctx.restore()
}

/** Dibuja rugs primero (nivel suelo), luego el resto de muebles. */
function drawAllFurniture(ctx: CanvasRenderingContext2D) {
  for (const pieces of Object.values(FURNITURE)) {
    for (const piece of pieces) {
      if (piece.type === 'rug') {
        clearShadow(ctx)
        drawFurniturePiece(ctx, piece)
      }
    }
  }
  for (const pieces of Object.values(FURNITURE)) {
    for (const piece of pieces) {
      if (piece.type !== 'rug') {
        clearShadow(ctx)
        drawFurniturePiece(ctx, piece)
      }
    }
  }
}

// ─── Sistema de iluminación ───────────────────────────────────────────────────

/**
 * Luces de techo (solo light mode) — luz de ventana simulada.
 * En dark mode este sistema está eliminado — no usamos focos teatrales.
 */
function drawCeilingLights(_ctx: CanvasRenderingContext2D) {
  // Dark mode: eliminado — la iluminación viene de drawUniformNightAmbient()
  // Light mode: la luz de ventana la maneja drawWindowLight()
}

/**
 * Luz de ventana (solo light mode) — gradiente direccional desde el borde superior.
 * Simula luz natural entrando por ventanas en la pared norte.
 */
function drawWindowLight(ctx: CanvasRenderingContext2D) {
  if (currentTheme !== 'light') return
  ctx.save()
  ctx.globalCompositeOperation = 'screen'

  for (const room of ROOMS) {
    const g = ctx.createLinearGradient(room.x, room.y, room.x, room.y + room.h)
    g.addColorStop(0,    'rgba(200,220,255,0.30)')
    g.addColorStop(0.38, 'rgba(200,220,255,0.10)')
    g.addColorStop(1,    'rgba(200,220,255,0.00)')

    ctx.fillStyle = g
    ctx.fillRect(room.x, room.y, room.w, room.h)
  }

  ctx.restore()
}

/**
 * Brillo ambiental de sala — cada sala emana su accent color.
 * Dark: screen composite muy sutil (0.05 max) — tinte de identidad, NO foco.
 *   La identidad de color viene PRINCIPALMENTE del floorColor.
 *   Este radial solo añade un sutil glow de acento.
 * Light: source-over, suave tint.
 */
function drawAmbientLighting(ctx: CanvasRenderingContext2D) {
  ctx.save()

  if (currentTheme === 'dark') {
    ctx.globalCompositeOperation = 'screen'
    for (const room of ROOMS) {
      const cx = room.x + room.w / 2
      const cy = room.y + room.h / 2
      const r  = Math.max(room.w, room.h) * 0.65  // cubre toda la sala uniformemente

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      // Muy sutil — el color viene del floor, no del glow
      g.addColorStop(0,    hexToRgba(room.accentColor, 0.055))
      g.addColorStop(0.55, hexToRgba(room.accentColor, 0.025))
      g.addColorStop(1,    'transparent')

      ctx.fillStyle = g
      ctx.fillRect(room.x, room.y, room.w, room.h)
    }
  } else {
    // Light mode: tint sutil sobre el suelo claro
    ctx.globalCompositeOperation = 'source-over'
    for (const room of ROOMS) {
      const cx = room.x + room.w / 2
      const cy = room.y + room.h / 2
      const r  = Math.max(room.w, room.h) * 0.50

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      g.addColorStop(0,   hexToRgba(room.accentColor, 0.11))
      g.addColorStop(0.6, hexToRgba(room.accentColor, 0.040))
      g.addColorStop(1,   'transparent')

      ctx.fillStyle = g
      ctx.fillRect(room.x, room.y, room.w, room.h)
    }
  }

  ctx.restore()
}

/**
 * Iluminación nocturna global uniforme (solo dark mode).
 *
 * Filosofía: la iluminación de una oficina real de noche bajo LEDs es
 * UNIFORME y DIFUSA — no hay focos ni manchas. El nivel lumínico general
 * es el mismo en toda la sala, con muy ligeras variaciones de temperatura
 * de color (más frío cerca de ventanas, más cálido cerca de pantallas).
 *
 * Implementación en DOS capas NO acumulativas:
 *
 *   Layer 1 (source-over, todo el canvas):
 *     Luz LED blanca-fría uniforme desde arriba. source-over no acumula,
 *     así que aplicarlo sobre todo el canvas NO crea manchas brillantes —
 *     simplemente levanta el nivel de negro a un gris oscuro uniforme.
 *
 *   Layer 2 (source-over, solo salas):
 *     Sutil tinte cálido sobre las salas — simula el calor de LED de
 *     interior vs el azul de ventanas. Muy bajo, solo diferencia salas
 *     de pasillos muy sutilmente.
 *
 * Por qué source-over y NO screen:
 *   screen en varios layers se acumula → manchas brillantes donde se solapan.
 *   source-over a opacidad baja NO acumula — es exactamente como el alpha
 *   compositing de una capa semitransparente uniforme.
 */
function drawUniformNightAmbient(ctx: CanvasRenderingContext2D) {
  if (currentTheme !== 'dark') return
  ctx.save()

  // ── Layer 1: luz LED global — cubre TODO el canvas uniformemente ─────────
  // Gradiente muy suave top→bottom (el techo emite luz, el suelo rebota menos)
  ctx.globalCompositeOperation = 'source-over'
  const globalG = ctx.createLinearGradient(0, 0, 0, WORLD_H)
  globalG.addColorStop(0,    'rgba(210,215,250,0.052)')  // cool-white LED
  globalG.addColorStop(0.45, 'rgba(205,210,245,0.032)')
  globalG.addColorStop(1,    'rgba(200,205,240,0.018)')
  ctx.fillStyle = globalG
  ctx.fillRect(0, 0, WORLD_W, WORLD_H)

  // ── Layer 2: sutil calidez en salas (LED interior más cálido que pasillos) ─
  ctx.globalCompositeOperation = 'source-over'
  for (const room of ROOMS) {
    // Tinte warm-white muy sutil sobre toda la sala, plano (NO radial)
    ctx.fillStyle = 'rgba(255,245,220,0.018)'
    ctx.fillRect(room.x, room.y, room.w, room.h)
  }

  ctx.restore()
}

/**
 * Glow de monitor — spot azul-frío desde cada workstation (screen composite).
 * Simula la luz de pantalla proyectándose sobre la superficie del escritorio.
 */
function drawMonitorGlows(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.globalCompositeOperation = 'screen'

  for (const pieces of Object.values(FURNITURE)) {
    for (const p of pieces) {
      if (p.type === 'desk') {
        const cx     = p.x + p.w / 2
        const cy     = p.y + p.h * 0.32  // posición del monitor (parte superior)
        const radius = 54

        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        // Screen glow de monitor — sutil, realista (pantallas emiten luz)
        const glowAlpha = currentTheme === 'dark' ? 0.07 : 0.04
        g.addColorStop(0,    `rgba(56,189,248,${glowAlpha})`)
        g.addColorStop(0.6,  `rgba(56,189,248,${glowAlpha * 0.3})`)
        g.addColorStop(1,    'transparent')

        ctx.fillStyle = g
        ctx.fillRect(p.x - radius, p.y - radius, p.w + radius * 2, p.h + radius * 2)
      }
    }
  }

  ctx.restore()
}

/**
 * Lights de pasillo — eliminado para evitar el efecto teatral de spots aislados.
 * Los pasillos obtienen su luminosidad del color base corridor (#282738)
 * combinado con el ambient global uniforme de drawUniformNightAmbient().
 */
function drawCorridorPathLights(_ctx: CanvasRenderingContext2D) {
  // No-op — eliminado en el rediseño de iluminación ambiental uniforme
}

// ─── Etiquetas de sala ────────────────────────────────────────────────────────

function drawRoomLabels(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'top'

  for (const room of ROOMS) {
    const cx     = room.x + room.w / 2
    const labelY = room.y + 18
    const text   = room.label.toUpperCase()
    ctx.font      = '700 10px "Inter", system-ui, sans-serif'
    const tw      = ctx.measureText(text).width
    const padH = 8, padV = 4
    const lx = cx - tw / 2 - padH
    const ly = labelY - padV

    // Pill background
    ctx.fillStyle = P.labelBg
    rr(ctx, lx, ly, tw + padH * 2, 10 + padV * 2, 4); ctx.fill()

    // Accent border on pill
    ctx.strokeStyle = hexToRgba(room.accentColor, 0.32)
    ctx.lineWidth   = 1
    rr(ctx, lx, ly, tw + padH * 2, 10 + padV * 2, 4); ctx.stroke()

    // Text
    ctx.fillStyle     = hexToRgba(room.accentColor, currentTheme === 'dark' ? 0.75 : 0.88)
    ctx.font          = '600 10px "Inter", system-ui, sans-serif'
    ctx.letterSpacing = '0.08em'
    ctx.fillText(text, cx, labelY)
  }

  ctx.restore()
}

// ─── Viñeta ───────────────────────────────────────────────────────────────────

function drawVignette(ctx: CanvasRenderingContext2D) {
  ctx.save()
  // Dark: 0.15 — muy sutil, solo marca el perímetro del mundo
  // La oscuridad ahora viene del color base del suelo, no de la viñeta
  const vigAlpha = currentTheme === 'dark' ? 0.15 : 0.18

  const vg = ctx.createRadialGradient(
    WORLD_W / 2, WORLD_H / 2, WORLD_H * 0.28,
    WORLD_W / 2, WORLD_H / 2, WORLD_H * 0.90,
  )
  vg.addColorStop(0, 'transparent')
  vg.addColorStop(1, `rgba(0,0,0,${vigAlpha})`)

  ctx.fillStyle = vg
  ctx.fillRect(0, 0, WORLD_W, WORLD_H)
  ctx.restore()
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Dibuja el mundo completo de la oficina en el contexto Canvas 2D.
 *
 * @param ctx    Canvas 2D context — debe tener el transform DPR ya aplicado
 * @param theme  'dark' | 'light' — controla paleta y sistema de iluminación
 *
 * Llamar cada vez que cambia el tema. Usar ctx.setTransform() antes de
 * llamar a esta función para evitar acumulación de transforms.
 */
export function drawOfficeWorld(
  ctx: CanvasRenderingContext2D,
  theme: 'light' | 'dark' = 'dark',
): void {
  // Actualizar paleta global antes de dibujar
  currentTheme = theme
  P = theme === 'dark' ? DARK : LIGHT

  clearShadow(ctx)

  // 1. Fondo
  drawBackground(ctx)

  // 2. Pasillos
  drawCorridors(ctx)

  // 3. Suelos de salas (color de material + textura)
  for (const room of ROOMS) {
    drawRoomFloor(ctx, room)
  }

  // 4. Muros
  drawWalls(ctx)

  // 5. Líneas guía de corredor
  drawCorridorCenterLines(ctx)

  // 6. Muebles (rugs primero → volúmenes encima)
  drawAllFurniture(ctx)

  // 7. Iluminación nocturna global uniforme (dark) — base luminosa sin focos
  drawUniformNightAmbient(ctx)

  // 8. Corridor lights — no-op en dark (eliminado), no-op en light también
  drawCorridorPathLights(ctx)

  // 9. Glow de monitores — sutil, realista
  drawMonitorGlows(ctx)

  // 10. Ceiling lights — no-op en dark; luz de ventana en light
  drawCeilingLights(ctx)
  drawWindowLight(ctx)

  // 11. Accent ambiental por sala (muy sutil en dark, refuerza identidad de color)
  drawAmbientLighting(ctx)

  // 12. Etiquetas de sala
  drawRoomLabels(ctx)

  // 13. Viñeta del mundo
  drawVignette(ctx)

  clearShadow(ctx)
}
