// presence.ts — sistema de presencia y estado de salas
//
// Única fuente de verdad para:
//   · PresenceActivity → qué está haciendo cada usuario ahora mismo
//   · RoomState        → energía/estado computado de cada sala
//   · ZONE_GLOW_KEYFRAME → mapa zone id → nombre del keyframe CSS de glow
//
// Fase 4+: MOCK_PRESENCE se reemplazará por datos del WebSocket en tiempo real.

import { UserStatus, User } from '@/types'
import { ZONE_OCCUPANCY } from './mock-data'

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Estado de actividad visible encima del avatar */
export type PresenceActivity =
  | 'idle'      // pulso suave — sin actividad notable
  | 'typing'    // tres puntos animados — escribiendo en chat
  | 'speaking'  // anillos expansivos — en llamada de voz
  | 'meeting'   // badge LIVE — reunión activa con cámara
  | 'away'      // 💤 flotando — ausente del teclado

/** Estado computado de la sala según su ocupación */
export type RoomState =
  | 'empty'    // sin ocupantes
  | 'active'   // ocupada, sin reunión formal
  | 'busy'     // ocupada con gente en estado BUSY
  | 'meeting'  // reunión en curso (alguien en IN_MEETING)

// ─── Mock presence — actividades de cada compañero ───────────────────────────
//
// Distribuidas para máxima variedad visual: typing, speaking, meeting, away, idle.

export const MOCK_PRESENCE: Record<string, PresenceActivity> = {
  '2': 'typing',   // Ana Torres — Lobby: respondiendo mensajes
  '3': 'meeting',  // Miguel Herrera — Meeting: reunión con cámara
  '4': 'idle',     // Sofia Ruiz — Lobby: disponible, sin actividad visible
  '5': 'away',     // Diego Mendoza — Focus: se alejó del teclado
  '6': 'speaking', // Valeria Chen — Lobby: en llamada de voz
}

// ─── Mapa zone id → keyframe CSS de glow ambiental ───────────────────────────
//
// Los keyframes se definen en globals.css.
// Colores elegidos para coincidir exactamente con los accents de OFFICE_ZONES.

export const ZONE_GLOW_KEYFRAME: Record<string, string> = {
  lobby:     'glowLobby',
  focus:     'glowFocus',
  cafeteria: 'glowCafeteria',
  meeting:   'glowMeeting',
  collab:    'glowCollab',
  support:   'glowSupport',
}

// ─── Computar estado de sala ──────────────────────────────────────────────────

/**
 * Deriva el estado de energía de una sala a partir de sus ocupantes.
 * Se recalcula en render de RoomNode — es pura y barata.
 */
export function computeRoomState(zoneId: string, allUsers: User[]): RoomState {
  const ids = ZONE_OCCUPANCY[zoneId] ?? []
  if (ids.length === 0) return 'empty'

  const statuses = ids
    .map((id) => allUsers.find((u) => u.id === id)?.status)
    .filter((s): s is UserStatus => s !== undefined)

  if (statuses.some((s) => s === UserStatus.IN_MEETING)) return 'meeting'
  if (statuses.some((s) => s === UserStatus.BUSY))       return 'busy'
  return 'active'
}

// ─── Textos de actividad legibles ─────────────────────────────────────────────

export const PRESENCE_LABELS: Record<PresenceActivity, string> = {
  idle:     'disponible',
  typing:   'escribiendo',
  speaking: 'en llamada',
  meeting:  'en reunión',
  away:     'ausente',
}

export const ROOM_STATE_LABELS: Record<RoomState, string> = {
  empty:   'Vacío',
  active:  'Activo',
  busy:    'Ocupado',
  meeting: 'Reunión activa',
}

export const ROOM_STATE_COLOR: Record<RoomState, string> = {
  empty:   'text-[var(--color-fg-quaternary)]',
  active:  'text-green-400',
  busy:    'text-orange-400',
  meeting: 'text-rose-400',
}
