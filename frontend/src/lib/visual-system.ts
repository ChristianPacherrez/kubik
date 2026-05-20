// visual-system.ts — Kubik Design System tokens
//
// Single source of truth para motion, spacing, layers y dimensiones.
// Importar desde aquí en lugar de hardcodear valores en los componentes.
//
// Filosofía:
//   "Calm tech" — suave, preciso, colaborativo. No un videojuego.
//   Cada decisión apunta a: legibilidad, calma y presencia premium.

// ─── Z-Index layers ───────────────────────────────────────────────────────────

export const Z = {
  floor:      0,   // SVG floor textures
  furniture:  1,   // SVG furniture backdrop in rooms
  corridor:   2,   // corridors above floor
  npc:        22,  // NPCs (compañeros mock)
  peer:       23,  // peers remotos (realtime)
  player:     25,  // jugador local (siempre encima)
  roomOverlay:28,  // room rings / overlays
  hud:        30,  // MapControls, StatusLegend
  sidebar:    40,  // MapSidebar
  toast:      50,  // ProximityToast
  modal:      60,  // modales futuros
} as const

// ─── Avatar sizing ────────────────────────────────────────────────────────────

export const AVATAR = {
  // Dimensiones del sprite SVG
  W:         32,
  H:         48,
  // Offsets de anclaje (el punto de movimiento es el torso, no la cabeza ni los pies)
  OFFSET_X:  16,   // centro horizontal
  OFFSET_Y:  28,   // 58% del alto → ancla en torso
  // Sombra en el suelo
  SHADOW_W:  20,
  SHADOW_H:  6,
  SHADOW_Y:  6,    // px debajo del sprite
} as const

// ─── Motion language ──────────────────────────────────────────────────────────
//
// Todos los valores de easing están calibrados para "calm tech":
// ninguna animación debería sentirse brusca ni exagerada.

export const MOTION = {
  // Avatar walk hop
  WALK_DURATION:    '0.28s',
  WALK_EASING:      'ease-in-out',

  // Avatar idle breathe
  IDLE_DURATION:    '3.0s',
  IDLE_EASING:      'ease-in-out',

  // NPC float (cada NPC tiene su propia duración ± variación)
  NPC_FLOAT_BASE:   2.4,  // segundos
  NPC_FLOAT_RANGE:  2.0,  // +0 a +2s variación

  // Realtime lerp speed (PeerAvatar interpolation)
  // 0.12 → lag ~80ms a 60fps, cubre latencia Supabase sin verse robótico
  LERP:             0.12,

  // Broadcast rate (movimiento → Supabase)
  BROADCAST_MS:     80,   // ~12fps

  // Entrada de peer nuevo
  ENTER_DURATION:   '0.4s',
  ENTER_EASING:     'cubic-bezier(0.34, 1.56, 0.64, 1)', // spring elástico

  // Salida de peer (linger antes de unmount)
  LEAVE_DURATION:   '0.8s',
  LEAVE_LINGER_MS:  900,

  // Transiciones de UI (sidebar, badges, etc.)
  UI_FAST:   '0.1s ease',
  UI_NORMAL: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  UI_SLOW:   '0.35s cubic-bezier(0.4, 0, 0.2, 1)',
} as const

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const SHADOW = {
  // Avatar ground shadow
  AVATAR:    'radial-gradient(ellipse, rgba(0,0,0,0.22) 0%, transparent 80%)',
  AVATAR_BLUR: '2px',

  // Room card (cuando hay sesión activa)
  ROOM_ACTIVE: '0 0 20px rgba(124,58,237,0.18), 0 4px 16px rgba(0,0,0,0.20)',

  // Player ring glow
  PLAYER_RING: '0 0 0 2px rgba(124,58,237,0.55)',
} as const

// ─── Avatar body colors (Blob / "Calm Bean" style) ───────────────────────────
//
// 8 colores vibrantes estilo Gather — legibles sobre fondos claros y oscuros.
// Asignados determinísticamente por userId hash.

export type BlobColor = { body: string; dark: string; label: string }

export const BLOB_COLORS: BlobColor[] = [
  { body: '#E07B45', dark: '#C86A34', label: 'orange'  },  // Gather signature orange
  { body: '#5B8FF9', dark: '#4070E0', label: 'blue'    },  // soft blue
  { body: '#52C880', dark: '#38A060', label: 'green'   },  // vibrant green
  { body: '#F0B030', dark: '#D09020', label: 'amber'   },  // warm amber
  { body: '#C084FC', dark: '#9060D8', label: 'purple'  },  // soft purple
  { body: '#F07090', dark: '#D85070', label: 'rose'    },  // warm rose
  { body: '#40C0D8', dark: '#2898B0', label: 'teal'    },  // fresh teal
  { body: '#90C050', dark: '#70A030', label: 'lime'    },  // lime green
]

/** Asigna un color de blob determinístico a partir de un seed (userId o nombre) */
export function getBlobColor(seed: string): BlobColor {
  let h = 5381
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) & 0x7fffffff
  }
  return BLOB_COLORS[Math.abs(h) % BLOB_COLORS.length]
}

/** El jugador local usa violet (color de marca Kubik) — distinto a todos los BLOB_COLORS */
export const PLAYER_COLOR: BlobColor = { body: '#7C3AED', dark: '#5B21B6', label: 'violet' }

// ─── Typography (en el mapa) ──────────────────────────────────────────────────

export const MAP_TYPE = {
  // Nombre de avatar
  NAME_SIZE:   8,    // px
  NAME_LINE_H: '13px',

  // Labels de sala
  ROOM_BADGE:  10,   // px

  // Corredor
  CORRIDOR:    9,    // px
} as const

// ─── Status dot colors (hex — sin Tailwind para usar en SVG/inline styles) ───

export const STATUS_HEX = {
  available:  '#22c55e',  // green-500
  busy:       '#f97316',  // orange-500
  'in-meeting':'#ef4444', // red-500
  away:       '#94a3b8',  // slate-400
  offline:    '#64748b',  // slate-500
} as const
