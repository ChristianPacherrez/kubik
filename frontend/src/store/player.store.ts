// player.store.ts — estado local del jugador (el usuario autenticado en el mapa)
//
// Diseño para escalabilidad:
//   · setPosition / setDirection / setMoving → actualizados a 60fps desde useMovement
//   · currentZoneId → detectado por el loop de movimiento, sincronizado con officeStore
//   · init → llamado una vez desde InteractiveMap con datos de Clerk
//
// Fase 4+: reemplazar NPC_POSITIONS con datos reales del WebSocket,
// añadir peers: Record<string, PeerState> aquí.

import { create } from 'zustand'
import { PLAYER_START_X, PLAYER_START_Y, detectZoneAtPoint } from '@/lib/movement'

export type Direction = 'up' | 'down' | 'left' | 'right'

interface PlayerState {
  // ── Posición y movimiento ─────────────────────────────
  x:          number
  y:          number
  direction:  Direction
  isMoving:   boolean

  // ── Zona actual ───────────────────────────────────────
  currentZoneId: string | null

  // ── Identidad (se rellena desde Clerk en el mount) ───
  name:      string
  avatarUrl: string | null
  /** Timestamp de la conexión inicial — se envía en el track de Presence */
  joinedAt:  number

  // ── Proximidad a NPCs ─────────────────────────────────
  // userId del NPC más cercano dentro del radio, o null
  nearbyNpcId: string | null

  // ── Acciones ──────────────────────────────────────────
  setPosition:     (x: number, y: number) => void
  setDirection:    (dir: Direction) => void
  setMoving:       (moving: boolean) => void
  setCurrentZone:  (zoneId: string | null) => void
  setNearbyNpc:    (id: string | null) => void
  init:            (name: string, avatarUrl: string | null) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  x:             PLAYER_START_X,
  y:             PLAYER_START_Y,
  direction:     'down',
  isMoving:      false,
  currentZoneId: detectZoneAtPoint(PLAYER_START_X, PLAYER_START_Y),
  name:          'Tú',
  avatarUrl:     null,
  joinedAt:      Date.now(),
  nearbyNpcId:   null,

  setPosition:    (x, y) => set({ x, y }),
  setDirection:   (dir)  => set({ direction: dir }),
  setMoving:      (moving) => set({ isMoving: moving }),
  setCurrentZone: (zoneId) => set({ currentZoneId: zoneId }),
  setNearbyNpc:   (id) => set({ nearbyNpcId: id }),
  init:           (name, avatarUrl) => set({ name, avatarUrl }),
}))
