'use client'

// useLiveKitRoom — gestiona el ciclo de vida de la conexión LiveKit
//
// · Se conecta automáticamente al montar OfficeCanvas
// · Si NEXT_PUBLIC_LIVEKIT_URL no está configurado → no-op (degrada gracefully)
// · La Room vive en lib/livekit.ts como singleton para que useSpatialAudio
//   pueda accederla sin prop drilling ni Context overhead
//
// Fase C (video): añadir enableCamera() / disableCamera() aquí

import { useEffect, useRef } from 'react'
import { usePlayerStore }    from '@/store/player.store'
import {
  createAndConnectRoom,
  disconnectRoom,
  toggleMute as _toggleMute,
} from '@/lib/livekit'

const OFFICE_ROOM = 'office'
const LK_URL      = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_LIVEKIT_URL ?? ''
  : ''

// ─── Token fetcher ────────────────────────────────────────────────────────────

async function fetchToken(room: string, name: string): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/livekit/token?room=${encodeURIComponent(room)}&name=${encodeURIComponent(name)}`,
    )

    if (res.status === 503) {
      // LiveKit not configured on the server — expected in dev without creds
      console.info('[LiveKit] Not configured on server — audio disabled')
      return null
    }

    if (!res.ok) {
      console.warn('[LiveKit] Token error:', res.status)
      return null
    }

    const data = await res.json()
    return (data.token as string | null) ?? null
  } catch (err) {
    console.warn('[LiveKit] Fetch error:', err)
    return null
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLiveKitRoom() {
  const name          = usePlayerStore((s) => s.name)
  const connectingRef = useRef(false)

  useEffect(() => {
    // No-op if LiveKit URL is not set (local dev without audio config)
    if (!LK_URL) {
      console.info('[LiveKit] NEXT_PUBLIC_LIVEKIT_URL not set — audio disabled')
      return
    }

    if (connectingRef.current) return
    connectingRef.current = true

    ;(async () => {
      const token = await fetchToken(OFFICE_ROOM, name)

      if (!token) {
        connectingRef.current = false
        return
      }

      try {
        await createAndConnectRoom(LK_URL, token, OFFICE_ROOM)
        console.info('[LiveKit] ✓ Connected to room:', OFFICE_ROOM)
      } catch (err) {
        console.warn('[LiveKit] Connection failed:', err)
        connectingRef.current = false
      }
    })()

    return () => {
      disconnectRoom().catch(() => {})
    }
  // Run once on mount — name is stable after Clerk init
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { toggleMute: _toggleMute }
}
