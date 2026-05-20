'use client'

// NPCAvatar — "Calm Bean" avatar de NPCs mock (Visual Polish Sprint)
//
// Posición fija, animación idle CSS pura. Sin rAF loop.
// data-dir="down", data-moving="false" — siempre idle, facing forward.

import { useMemo }    from 'react'
import { User }       from '@/types'
import { NPC_POSITIONS }   from '@/lib/movement'
import { MOCK_PRESENCE }   from '@/lib/presence'
import { PresenceIndicator } from './PresenceIndicator'
import {
  AvatarSprite, SPRITE_W, SPRITE_H, SPRITE_OFFSET_X, SPRITE_OFFSET_Y,
  getInitials,
} from './AvatarSprite'
import { getBlobColor, MOTION } from '@/lib/visual-system'
import { ProximityGlow }   from './ProximityGlow'
import { KnockIndicator }  from './KnockIndicator'
import { useSpatialStore } from '@/store/spatial.store'

function getFloatParams(userId: string) {
  const seed = parseInt(userId, 10) || userId.charCodeAt(0) || 1
  return {
    dur:   MOTION.NPC_FLOAT_BASE + (seed % 8) * 0.28,
    delay: (seed % 5) * 0.45,
  }
}

export function NPCAvatar({ user }: { user: User }) {
  const pos = NPC_POSITIONS[user.id]
  if (!pos) return null

  const color    = useMemo(() => getBlobColor(user.id),   [user.id])
  const initials = useMemo(() => getInitials(user.name),  [user.name])
  const { dur, delay } = useMemo(() => getFloatParams(user.id), [user.id])
  const activity = MOCK_PRESENCE[user.id] ?? 'idle'

  const setSelected = useSpatialStore.getState().setSelected
  const setHovered  = useSpatialStore.getState().setHovered

  return (
    <div
      style={{
        position:      'absolute',
        left:          pos.x - SPRITE_OFFSET_X,
        top:           pos.y - SPRITE_OFFSET_Y,
        width:         SPRITE_W,
        height:        SPRITE_H,
        zIndex:        22,
        pointerEvents: 'auto',
        cursor:        'pointer',
      }}
      onClick={() => setSelected(user.id, { x: pos.x, y: pos.y }, true)}
      onMouseEnter={() => setHovered(user.id)}
      onMouseLeave={() => setHovered(null)}
    >
      {/* ── Proximity glow (world space) ──────────────────── */}
      <ProximityGlow userId={user.id} color={color} isNpc />

      {/* ── Knock indicator (badge bell) ─────────────────── */}
      <KnockIndicator userId={user.id} />

      <div
        style={{
          position:   'absolute',
          inset:      0,
          animation:  `npcFloat ${dur}s ease-in-out ${delay}s infinite`,
          willChange: 'transform',
        }}
      >
        {/* Activity rings (speaking, typing, etc.) */}
        <PresenceIndicator activity={activity} size={SPRITE_W} />

        {/* Blob sprite — idle, facing down */}
        <AvatarSprite color={color} initials={initials} />
      </div>

      {/* Nombre */}
      <div
        style={{
          position:      'absolute',
          top:           SPRITE_H + 2,
          left:          '50%',
          transform:     'translateX(-50%)',
          whiteSpace:    'nowrap',
          pointerEvents: 'none',
          userSelect:    'none',
        }}
      >
        <span
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            padding:        '2px 7px',
            borderRadius:   '999px',
            fontSize:       '10px',
            fontWeight:     600,
            lineHeight:     '15px',
            background:     'rgba(16,24,40,0.78)',
            color:          '#FFFFFF',
            boxShadow:      '0 1px 3px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(6px)',
            whiteSpace:     'nowrap',
          }}
        >
          {user.name.split(' ')[0]}
        </span>
      </div>
    </div>
  )
}
