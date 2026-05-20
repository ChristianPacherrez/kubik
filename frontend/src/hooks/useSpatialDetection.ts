// useSpatialDetection.ts — Motor de detección de proximidad espacial
//
// Corre a ~15fps (67ms). Lee posiciones del playerStore y peerPositions cache.
// Actualiza spatial.store con las zonas de proximidad de cada usuario/NPC.
// Separado de useProximity (que alimenta ProximityPanel) — no colisión.
//
// Zonas:
//   touch  ≤ 55px  — interacción directa (card auto-show, audio auto-connect)
//   near   ≤ 100px — prompt de interacción visible
//   aura   ≤ 200px — presencia detectada (glow sutil)

import { useEffect, useRef } from 'react'
import { usePlayerStore }                from '@/store/player.store'
import { useRealtimeStore, getPeerPosition } from '@/store/realtime.store'
import { useSpatialStore, ProximityZone }    from '@/store/spatial.store'
import { NPC_POSITIONS }                    from '@/lib/movement'
import { MOCK_USERS }                        from '@/lib/mock-data'

// ─── Thresholds ───────────────────────────────────────────────────────────────

export const ZONE_TOUCH  = 55
export const ZONE_NEAR   = 100
export const ZONE_AURA   = 200

const NPC_IDS = new Set(MOCK_USERS.map((u) => u.id))

function getZone(dist: number): ProximityZone | null {
  if (dist <= ZONE_TOUCH) return 'touch'
  if (dist <= ZONE_NEAR)  return 'near'
  if (dist <= ZONE_AURA)  return 'aura'
  return null
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSpatialDetection() {
  const setZones    = useSpatialStore.getState()._setZones
  const setSelected = useSpatialStore.getState().setSelected
  const prevZonesRef = useRef<Record<string, ProximityZone>>({})

  useEffect(() => {
    const tick = () => {
      const { x, y } = usePlayerStore.getState()
      const peers = Object.values(useRealtimeStore.getState().peers).filter(
        (p) => !p.isLeaving
      )

      const zones: Record<string, ProximityZone> = {}

      // ── Real peers ────────────────────────────────────────────────────────
      for (const peer of peers) {
        const pos = getPeerPosition(peer.userId)
        if (!pos) continue
        const zone = getZone(Math.hypot(x - pos.x, y - pos.y))
        if (zone) zones[peer.userId] = zone
      }

      // ── NPCs (posiciones fijas) ────────────────────────────────────────────
      for (const [npcId, pos] of Object.entries(NPC_POSITIONS)) {
        const zone = getZone(Math.hypot(x - pos.x, y - pos.y))
        if (zone) zones[npcId] = zone
      }

      // Solo actualizar el store si algo cambió (evita re-renders innecesarios)
      const prev = prevZonesRef.current
      const changed =
        Object.keys(zones).length !== Object.keys(prev).length ||
        Object.entries(zones).some(([id, z]) => prev[id] !== z)

      if (changed) {
        prevZonesRef.current = zones
        setZones(zones)

        // Si el peer seleccionado ya salió del rango AURA, cerrar la card
        const { selectedPeerId } = useSpatialStore.getState()
        if (selectedPeerId && !zones[selectedPeerId]) {
          setSelected(null)
        }
      }
    }

    const id = setInterval(tick, 67) // ~15fps
    tick() // cálculo inmediato al montar
    return () => clearInterval(id)
  }, [setZones, setSelected])
}
