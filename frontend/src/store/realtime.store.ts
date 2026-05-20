// realtime.store.ts — estado de presencia + event emitter de movimiento
//
// Dos capas, separadas por frecuencia de actualización:
//
//   Capa 1 — Zustand (peers):
//     · Actualizado solo en join/leave/workMode-change (~segundos entre eventos)
//     · Controla qué <PeerAvatar> se monta/desmonta en React
//     · Incluye: identidad, status, workMode, zona — NO posición en tiempo real
//
//   Capa 2 — positionEmitter (module-level, fuera de Zustand):
//     · Actualizado a ~12fps vía Supabase Broadcast
//     · Llama directamente al rAF loop de PeerAvatar → 0 re-renders por frame
//     · PeerAvatar se suscribe en useEffect, actualiza style.left/top directo en DOM
//
//   Capa 3 — peerPositions cache (module-level):
//     · Mirror de la posición actual de cada peer (actualizado por emitPeerPosition)
//     · Leído por useProximity a ~10fps para detectar proximidad (sin Zustand)
//
//   Capa 4 — reactionSender (module-level):
//     · Registrado por useRealtimePresence con la referencia al canal Supabase
//     · ProximityPanel llama a sendReaction() — el canal broadcast llega al resto

import { create } from 'zustand'
import { UserStatus } from '@/types'
import { Direction } from './player.store'
import { WorkMode } from '@/lib/work-modes'

// ─── Capa 2: Position event emitter ──────────────────────────────────────────
//
// Bypasea completamente React para updates de posición (12fps × N peers).

type PositionCallback = (
  x:         number,
  y:         number,
  direction: Direction,
  isMoving:  boolean
) => void

const _positionListeners = new Map<string, PositionCallback>()

export function onPeerPosition(userId: string, fn: PositionCallback): () => void {
  _positionListeners.set(userId, fn)
  return () => _positionListeners.delete(userId)
}

export function emitPeerPosition(
  userId:    string,
  x:         number,
  y:         number,
  direction: Direction,
  isMoving:  boolean
): void {
  // Update position cache (used by useProximity — Capa 3)
  _peerPositions.set(userId, { x, y })
  // Fire rAF callback in PeerAvatar
  _positionListeners.get(userId)?.(x, y, direction, isMoving)
}

// ─── Capa 3: Peer position cache (for proximity detection) ───────────────────
//
// Parallel to the event emitter — stores last-known position of each peer.
// Read by useProximity at 10fps. No React, no Zustand.

const _peerPositions = new Map<string, { x: number; y: number }>()

/** Returns last-known map position of a peer, or null if not yet received */
export function getPeerPosition(userId: string): { x: number; y: number } | null {
  return _peerPositions.get(userId) ?? null
}

// ─── Capa 4: Reaction sender (module-level bridge to Supabase channel) ────────
//
// useRealtimePresence registers a sender after subscribing.
// ProximityPanel calls sendReaction() — zero coupling to channel internals.

type ReactionSender = (type: string) => void
let _sendReactionFn: ReactionSender | null = null

/** Called by useRealtimePresence after channel subscription */
export function registerReactionSender(fn: ReactionSender): void {
  _sendReactionFn = fn
}

/**
 * Called by ProximityPanel when the player clicks a reaction emoji.
 * Broadcasts to all peers via the registered channel sender.
 */
export function sendReaction(type: string): void {
  _sendReactionFn?.(type)
}

// ─── PeerPresence — snapshot de un peer remoto ────────────────────────────────

export interface PeerPresence {
  userId:    string
  name:      string
  avatarUrl: string | null
  status:    UserStatus
  /** Work mode — broadcast via Presence track */
  workMode:  WorkMode
  /** Zona actual — null = corredor */
  zoneId:    string | null
  joinedAt:  number
  isLeaving: boolean
}

// ─── Zustand Store ────────────────────────────────────────────────────────────

interface PresenceState {
  peers:       Record<string, PeerPresence>
  isConnected: boolean
  /** Ephemeral reactions: userId → emoji (cleared after 2500ms automatically) */
  reactions:   Record<string, string>

  setPeers:       (peers: Record<string, PeerPresence>) => void
  setConnected:   (c: boolean) => void
  setPeerLeaving: (userId: string) => void
  removePeer:     (userId: string) => void
  /**
   * Shows a reaction bubble above a peer's avatar.
   * Auto-clears after 2500ms — no manual clearReaction needed.
   */
  setReaction:    (userId: string, type: string) => void
}

export const useRealtimeStore = create<PresenceState>((set, get) => ({
  peers:       {},
  isConnected: false,
  reactions:   {},

  setPeers: (peers) => set({ peers }),

  setConnected: (c) => set({ isConnected: c }),

  setPeerLeaving: (userId) =>
    set((state) => ({
      peers: state.peers[userId]
        ? { ...state.peers, [userId]: { ...state.peers[userId], isLeaving: true } }
        : state.peers,
    })),

  removePeer: (userId) =>
    set((state) => {
      const next = { ...state.peers }
      delete next[userId]
      // Clean up position cache so stale data doesn't linger
      _peerPositions.delete(userId)
      return { peers: next }
    }),

  setReaction: (userId, type) => {
    set((state) => ({ reactions: { ...state.reactions, [userId]: type } }))
    // Auto-clear after animation completes (matches reactionPop duration in CSS)
    setTimeout(() => {
      set((state) => {
        if (state.reactions[userId] !== type) return state // replaced — don't clear
        const next = { ...state.reactions }
        delete next[userId]
        return { reactions: next }
      })
    }, 2500)
  },
}))
