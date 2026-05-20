'use client'

// StatusAura — colored ring + glow + mode badge around an avatar (Spatial Social)
//
// Renders inside the float/walk container so it bobs with the avatar.
// "available" mode returns null — clean default, no visual noise.
// Other modes add: pulsing ring (box-shadow) + emoji badge above visor.
//
// CSS animation speed communicates urgency:
//   dnd  → 6s  (very slow / quiet)
//   focus → 4s  (calm but present)
//   collab → 2.2s (energetic)
//   meeting → 1.8s (busy / urgent)

import { WorkMode, WORK_MODES } from '@/lib/work-modes'
import { SPRITE_W, SPRITE_H }   from './AvatarSprite'

interface StatusAuraProps {
  mode: WorkMode
}

export function StatusAura({ mode }: StatusAuraProps) {
  if (mode === 'available') return null

  const cfg = WORK_MODES[mode]

  return (
    <>
      {/* Pulsing glow ring — sized to wrap the avatar body (not shadow/name) */}
      <div
        aria-hidden
        className="status-aura"
        style={{
          position:      'absolute',
          left:          -5,
          top:           -4,
          width:         SPRITE_W + 10,
          height:        SPRITE_H - 10,  // body height only, excludes ground shadow
          borderRadius:  15,
          pointerEvents: 'none',
          boxShadow:     `0 0 0 1.5px ${cfg.color}70, 0 0 16px ${cfg.glow}`,
          '--aura-dur':  cfg.auraDur,
        } as React.CSSProperties}
      />

      {/* Mode badge — emoji above the visor (skipped for "available") */}
      {cfg.badge && (
        <div
          aria-hidden
          style={{
            position:      'absolute',
            top:           -20,
            left:          '50%',
            transform:     'translateX(-50%)',
            fontSize:      11,
            lineHeight:    1,
            pointerEvents: 'none',
            userSelect:    'none',
            filter:        'drop-shadow(0 1px 3px rgba(0,0,0,0.7))',
          }}
        >
          {cfg.badge}
        </div>
      )}
    </>
  )
}
