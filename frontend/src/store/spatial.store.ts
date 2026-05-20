// spatial.store.ts — Estado del sistema de interacción espacial
//
// Gestiona:
//   · Zonas de proximidad por usuario (aura → near → touch)
//   · Peer seleccionado (card abierta)
//   · Peer hovered (estado hover en canvas)
//   · Knock/ping — "tocar la puerta" a un peer (Fase B UX)
//
// Separado de realtimeStore (posiciones, presencia) para responsabilidad única.

import { create } from 'zustand'

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Zona de proximidad espacial (distancia al jugador local) */
export type ProximityZone =
  | 'aura'   // 200px — glow sutil, indica presencia
  | 'near'   // 100px — glow + prompt de interacción
  | 'touch'  // 55px  — zona de interacción directa

/** Posición en coordenadas del mundo (world space) */
export interface WorldPos { x: number; y: number }

// ─── State ────────────────────────────────────────────────────────────────────

interface SpatialState {
  /** Mapa userId → zona de proximidad actual. Vacío = fuera de rango */
  zones: Record<string, ProximityZone>

  /** Peer con la card de interacción abierta */
  selectedPeerId:  string | null
  /** Posición del peer seleccionado en world space (para calcular screen pos) */
  selectedPeerPos: WorldPos | null
  /** Es un NPC (mock) o un peer real */
  selectedIsNpc:   boolean

  /** Peer con hover activo */
  hoveredPeerId: string | null

  /**
   * Knock/ping — mapa userId → true mientras el knock está activo (~2.5s).
   * Se auto-limpia. El KnockIndicator lo lee para mostrar la burbuja visual.
   */
  knocks: Record<string, true>

  // ── Actions ─────────────────────────────────────────────────────────────────
  setSelected:  (id: string | null, pos?: WorldPos | null, isNpc?: boolean) => void
  setHovered:   (id: string | null) => void
  _setZones:    (zones: Record<string, ProximityZone>) => void
  /**
   * Enviar knock a un peer: activa el KnockIndicator en su avatar durante 2.5s.
   * Patrón idéntico a setReaction en realtimeStore.
   */
  sendKnock:    (userId: string) => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSpatialStore = create<SpatialState>((set) => ({
  zones:           {},
  selectedPeerId:  null,
  selectedPeerPos: null,
  selectedIsNpc:   false,
  hoveredPeerId:   null,
  knocks:          {},

  setSelected: (id, pos = null, isNpc = false) =>
    set({
      selectedPeerId:  id,
      selectedPeerPos: pos ?? null,
      selectedIsNpc:   isNpc,
    }),

  setHovered: (id) => set({ hoveredPeerId: id }),

  _setZones: (zones) => set({ zones }),

  sendKnock: (userId) => {
    set((s) => ({ knocks: { ...s.knocks, [userId]: true } }))
    // Auto-limpia tras la animación (2.5s — igual que ReactionBubble)
    setTimeout(() => {
      set((s) => {
        if (!s.knocks[userId]) return s
        const next = { ...s.knocks }
        delete next[userId]
        return { knocks: next }
      })
    }, 2500)
  },
}))
