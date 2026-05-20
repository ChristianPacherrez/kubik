// map-layout.ts — Definición estática del plano de la oficina virtual
//
// Sistema de coordenadas: píxeles en pantalla (NO geográficos).
// Canvas de referencia: 1200 × 700 px
// Todo lo que el mapa necesita saber sobre la geometría viene de aquí.

// ─── Dimensiones del canvas ───────────────────────────────────────────────────

// ⚠️ Dimensiones del mundo actualizado al spatial engine.
// Las referencias a MAP_WIDTH/HEIGHT aún se exportan por compatibilidad.
export const MAP_WIDTH  = 1920
export const MAP_HEIGHT = 1280

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface RoomLayout {
  /** Mismo id que en OFFICE_ZONES y ZONE_OCCUPANCY */
  id: string
  x: number
  y: number
  width: number
  height: number
}

export interface CorridorLayout {
  id: string
  x: number
  y: number
  width: number
  height: number
  orientation: 'horizontal' | 'vertical'
}

export interface PillarLayout {
  id: string
  cx: number  // centro X
  cy: number  // centro Y
  r: number   // radio
}

// ─── Habitaciones ─────────────────────────────────────────────────────────────
//
//  Distribución en 3 columnas × 2 filas separadas por pasillos:
//
//  ┌──────────────────┬──────────────────┬──────────────────┐
//  │  Lobby  (40,40)  │  Focus (460,40)  │  Collab (780,40) │
//  │  360×260         │  260×260         │  380×260         │
//  ├──────────────────┼──────────────────┼──────────────────┤  ← corredor H (300-380)
//  │  Cafet. (40,380) │  Meet. (460,380) │  Supp.  (780,380)│
//  │  360×280         │  260×280         │  380×280         │
//  └──────────────────┴──────────────────┴──────────────────┘
//       ↑                   ↑
//  corredor V (400-460) corredor V (720-780)

export const ROOM_LAYOUTS: RoomLayout[] = [
  // Columna izquierda
  { id: 'lobby',     x: 40,  y: 40,  width: 360, height: 260 },
  { id: 'cafeteria', x: 40,  y: 380, width: 360, height: 280 },
  // Columna central
  { id: 'focus',     x: 460, y: 40,  width: 260, height: 260 },
  { id: 'meeting',   x: 460, y: 380, width: 260, height: 280 },
  // Columna derecha
  { id: 'collab',    x: 780, y: 40,  width: 380, height: 260 },
  { id: 'support',   x: 780, y: 380, width: 380, height: 280 },
]

// ─── Pasillos ────────────────────────────────────────────────────────────────

export const CORRIDORS: CorridorLayout[] = [
  // Pasillo vertical izquierdo (entre col izq y col central)
  { id: 'corridor-v-left',  x: 400, y: 0,   width: 60,   height: 700, orientation: 'vertical'   },
  // Pasillo vertical derecho (entre col central y col derecha)
  { id: 'corridor-v-right', x: 720, y: 0,   width: 60,   height: 700, orientation: 'vertical'   },
  // Pasillo horizontal (entre fila superior e inferior)
  { id: 'corridor-h',       x: 0,   y: 300, width: 1200, height: 80,  orientation: 'horizontal' },
]

// ─── Pilares ──────────────────────────────────────────────────────────────────
// En los cruces de pasillos verticales con el horizontal

export const PILLARS: PillarLayout[] = [
  { id: 'pillar-left',  cx: 430, cy: 340, r: 8 },
  { id: 'pillar-right', cx: 750, cy: 340, r: 8 },
]

// ─── Helper: buscar layout de una sala por id ─────────────────────────────────

export function getRoomLayout(id: string): RoomLayout | undefined {
  return ROOM_LAYOUTS.find((r) => r.id === id)
}
