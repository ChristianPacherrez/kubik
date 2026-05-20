'use client'

// useSpatialAudio — ajusta el volumen de cada peer según su zona de proximidad
//
// Corre a 2fps (500ms tick) — suficiente para ganancia espacial suave.
// Lee spatial.store.zones → calcula gain → llama audioTrack.setVolume().
//
// Zonas → ganancia:
//   touch (55px)  → 1.00  — conversación directa
//   near  (100px) → 0.70  — escucha normal
//   aura  (200px) → 0.30  — murmullo de fondo
//   fuera de aura → 0.00  — silencio total
//
// Esto crea la sensación de audio espacial de Gather/WorkAdventure
// sin necesitar posicionamiento binaural (HRTF).

import { useEffect } from 'react'
import { useSpatialStore } from '@/store/spatial.store'
import { getLiveKitRoom, gainForZone } from '@/lib/livekit'
import { Track, RemoteAudioTrack } from 'livekit-client'

const TICK_MS = 500   // 2fps — volumen no necesita precisión de frame

export function useSpatialAudio() {
  const zones = useSpatialStore((s) => s.zones)

  useEffect(() => {
    const applyGains = () => {
      const room = getLiveKitRoom()
      if (!room) return

      room.remoteParticipants.forEach((participant) => {
        const zone = zones[participant.identity]
        const gain = gainForZone(zone)

        participant.audioTrackPublications.forEach((pub) => {
          if (pub.kind === Track.Kind.Audio && pub.audioTrack instanceof RemoteAudioTrack) {
            pub.audioTrack.setVolume(gain)
          }
        })
      })
    }

    applyGains()   // Aplicar inmediatamente cuando cambian las zonas
    const id = setInterval(applyGains, TICK_MS)
    return () => clearInterval(id)
  }, [zones])
}
