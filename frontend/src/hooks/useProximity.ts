// useProximity.ts — Proximity detection between the local player and peers
//
// Runs at 10fps (100ms interval) — lightweight, never blocks 60fps render loop.
// Reads player position directly from playerStore (no subscription = no re-render).
// Reads peer positions from _peerPositions cache in realtime.store (module-level,
//   updated by emitPeerPosition at ~12fps — no Zustand overhead).
//
// Returns a React state object that updates only when proximity state changes.
// Used by ProximityPanel (a leaf component) so re-renders don't cascade.

import { useState, useEffect } from 'react'
import { usePlayerStore } from '@/store/player.store'
import { useRealtimeStore, getPeerPosition, PeerPresence } from '@/store/realtime.store'

// ─── Thresholds ───────────────────────────────────────────────────────────────

/** px — within this distance, show ProximityPanel interaction UI */
export const PROXIMITY_NEARBY = 80

/** px — within this distance, suggest a Huddle (group interaction) */
export const PROXIMITY_HUDDLE = 140

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NearbyPeer {
  peer:     PeerPresence
  distance: number
}

export interface ProximityState {
  /** Peers within PROXIMITY_NEARBY, sorted closest-first */
  nearbyPeers:  NearbyPeer[]
  /** Peers within PROXIMITY_HUDDLE (includes nearbyPeers) */
  huddlePeers:  PeerPresence[]
  /** The single closest peer within PROXIMITY_NEARBY, or null */
  closestPeer:  PeerPresence | null
  /** true when ≥1 peer is within PROXIMITY_HUDDLE */
  isInHuddle:   boolean
}

const EMPTY: ProximityState = {
  nearbyPeers: [],
  huddlePeers: [],
  closestPeer: null,
  isInHuddle:  false,
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProximity(): ProximityState {
  const [state, setState] = useState<ProximityState>(EMPTY)

  useEffect(() => {
    const tick = () => {
      const { x, y } = usePlayerStore.getState()
      const peers = Object.values(useRealtimeStore.getState().peers).filter(
        (p) => !p.isLeaving
      )

      const nearbyPeers: NearbyPeer[]   = []
      const huddlePeers: PeerPresence[] = []

      for (const peer of peers) {
        const pos = getPeerPosition(peer.userId)
        if (!pos) continue

        const dist = Math.hypot(x - pos.x, y - pos.y)
        if (dist <= PROXIMITY_HUDDLE) huddlePeers.push(peer)
        if (dist <= PROXIMITY_NEARBY) nearbyPeers.push({ peer, distance: dist })
      }

      nearbyPeers.sort((a, b) => a.distance - b.distance)

      setState((prev) => {
        // Shallow equality check to avoid unnecessary re-renders
        const sameNearby = prev.nearbyPeers.length === nearbyPeers.length &&
          nearbyPeers.every((n, i) => n.peer.userId === prev.nearbyPeers[i]?.peer.userId)
        const sameHuddle = prev.huddlePeers.length === huddlePeers.length

        if (sameNearby && sameHuddle) return prev

        return {
          nearbyPeers,
          huddlePeers,
          closestPeer: nearbyPeers[0]?.peer ?? null,
          isInHuddle:  huddlePeers.length > 0,
        }
      })
    }

    const id = setInterval(tick, 100) // 10fps
    tick() // compute immediately on mount
    return () => clearInterval(id)
  }, [])

  return state
}
