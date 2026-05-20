'use client'

// PresenceIndicator — overlay visual del estado de actividad de un avatar
//
// Se monta dentro del contenedor del avatar (relativo, PLAYER_SIZE × PLAYER_SIZE).
// Cada estado tiene una micro-animación CSS distinta — cero JS, cero re-renders.
//
// Estados:
//   idle     → null (solo el status dot del avatar es suficiente)
//   typing   → burbuja con tres puntos que saltan secuencialmente
//   speaking → dos anillos concéntricos que se expanden y desvanecen
//   meeting  → badge "● LIVE" sobre el avatar
//   away     → emoji 💤 flotante

import type { PresenceActivity } from '@/lib/presence'

interface PresenceIndicatorProps {
  activity: PresenceActivity
  /** Tamaño del avatar en px — para escalar los efectos proporcionalmente */
  size: number
}

export function PresenceIndicator({ activity, size }: PresenceIndicatorProps) {
  if (activity === 'idle') return null

  // ── Typing: tres puntos con delay escalonado ──────────────
  if (activity === 'typing') {
    return (
      <div
        className="
          absolute left-1/2 -translate-x-1/2
          flex items-center gap-px
          bg-[var(--color-bg-primary)]/95 border border-[var(--color-border-secondary)]
          rounded-full shadow-md shadow-black/30
          pointer-events-none
        "
        style={{ top: -(size * 0.7), paddingInline: 5, paddingBlock: 3 }}
      >
        {[0, 0.22, 0.44].map((delay) => (
          <span
            key={delay}
            className="rounded-full bg-[var(--color-fg-quaternary)]"
            style={{
              width:     4,
              height:    4,
              animation: `typingDot 1.1s ease-in-out ${delay}s infinite`,
            }}
          />
        ))}
      </div>
    )
  }

  // ── Speaking: anillos expansivos que salen del avatar ─────
  if (activity === 'speaking') {
    return (
      <>
        <div
          className="absolute rounded-full border-2 border-green-400 pointer-events-none"
          style={{
            inset:     -3,
            animation: 'speakRing 1.6s ease-out 0s infinite',
          }}
        />
        <div
          className="absolute rounded-full border border-green-400/60 pointer-events-none"
          style={{
            inset:     -3,
            animation: 'speakRing 1.6s ease-out 0.55s infinite',
          }}
        />
      </>
    )
  }

  // ── Meeting: badge LIVE con pulso rojo ────────────────────
  if (activity === 'meeting') {
    return (
      <div
        className="
          absolute left-1/2 -translate-x-1/2
          flex items-center gap-1
          bg-rose-600 text-white
          rounded-full shadow-lg shadow-rose-600/40
          font-bold tracking-wider
          pointer-events-none
        "
        style={{
          top:        -(size * 0.75),
          fontSize:   7,
          paddingInline: 5,
          paddingBlock:  2,
        }}
      >
        <span
          className="rounded-full bg-white"
          style={{
            width:     5,
            height:    5,
            animation: 'talkingPulse 1s ease-in-out infinite',
          }}
        />
        LIVE
      </div>
    )
  }

  // ── Away: 💤 flotando ─────────────────────────────────────
  if (activity === 'away') {
    return (
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none select-none"
        style={{
          top:       -(size * 0.8),
          fontSize:  12,
          animation: 'awayFloat 2.8s ease-in-out infinite',
        }}
      >
        💤
      </div>
    )
  }

  return null
}
