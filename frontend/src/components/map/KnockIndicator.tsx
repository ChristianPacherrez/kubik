'use client'

// KnockIndicator — badge visual de "toc" en el avatar del destinatario
//
// Diseño revisado:
//   · Badge principal 26px (era 20px) — más visible a cualquier zoom
//   · Ondas de impacto radial (3 anillos) — comunica "acaba de pasar algo"
//   · Pulso continuo mientras activo — no se puede ignorar
//   · 2.5s de duración (controlado por spatial.store.sendKnock timeout)
//
// Renderiza en world space — se escala con el zoom correctamente.

import { Bell } from 'lucide-react'
import { useSpatialStore } from '@/store/spatial.store'
import { SPRITE_W } from './AvatarSprite'

interface Props {
  userId: string
}

export function KnockIndicator({ userId }: Props) {
  const isKnocked = useSpatialStore((s) => Boolean(s.knocks[userId]))

  if (!isKnocked) return null

  return (
    <div
      aria-label="Alguien tocó la puerta"
      style={{
        position:      'absolute',
        top:           -10,
        left:          SPRITE_W - 6,
        zIndex:        35,
        pointerEvents: 'none',
      }}
    >
      {/* ── Ondas de impacto radial ─────────────────────────────────────── */}
      {[0, 0.5, 1.0].map((delay) => (
        <div
          key={delay}
          aria-hidden
          style={{
            position:     'absolute',
            top:          '50%',
            left:         '50%',
            transform:    'translate(-50%, -50%)',
            width:        26,
            height:       26,
            borderRadius: '50%',
            border:       '1.5px solid rgba(251,191,36,0.75)',
            animation:    `knockRipple 2s ease-out ${delay}s infinite`,
            pointerEvents:'none',
          }}
        />
      ))}

      {/* ── Badge principal ─────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position:      'relative',
          width:          26,
          height:         26,
          borderRadius:  '50%',
          background:    'linear-gradient(135deg, #fbbf24, #d97706)',
          boxShadow:     '0 0 0 2.5px var(--color-bg-primary, #fff), 0 0 16px rgba(245,158,11,0.75)',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          animation:     'knockBounceIn 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards, knockPulse 1.6s ease-in-out 0.38s infinite',
        }}
      >
        <Bell size={12} strokeWidth={2.5} color="#fff" />
      </div>
    </div>
  )
}
