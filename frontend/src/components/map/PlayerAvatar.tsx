'use client'

// PlayerAvatar — "Calm Bean" avatar del jugador local (Visual Polish Sprint)
//
// Performance: 0 re-renders a 60fps.
//   · store.subscribe → DOM directo para posición
//   · svgRef.dataset  → CSS toma el control de dirección/animación
//   · floatRef.style  → walk hop vs idle breathe
//
// Identidad: color indigo (marca Kubik) + anillo doble + badge de foto Clerk.

import { useRef, useEffect } from 'react'
import { usePlayerStore }    from '@/store/player.store'
import { useWorkModeStore }  from '@/store/work-mode.store'
import { useVoiceStore }     from '@/store/voice.store'
import {
  AvatarSprite, SPRITE_W, SPRITE_H, SPRITE_OFFSET_X, SPRITE_OFFSET_Y,
  getInitials,
} from './AvatarSprite'
import { PLAYER_COLOR }      from '@/lib/visual-system'
import { MOTION }            from '@/lib/visual-system'
import { StatusAura }        from './StatusAura'
import { ReactionBubble }    from './ReactionBubble'
import { PresenceIndicator } from './PresenceIndicator'

export function PlayerAvatar() {
  const posRef   = useRef<HTMLDivElement>(null)
  const floatRef = useRef<HTMLDivElement>(null)
  const svgRef   = useRef<SVGSVGElement>(null)

  // WorkMode + local reaction — re-render only on user-initiated change (rare)
  const workMode      = useWorkModeStore((s) => s.mode)
  const localReaction = useWorkModeStore((s) => s.localReaction)

  // Voice state — re-render solo en cambios de speaking/muted (poco frecuente)
  const isSpeaking = useVoiceStore((s) => s.isSpeaking)
  const isMuted    = useVoiceStore((s) => s.isMuted)

  // Leer estado inicial sin suscripción (no crea re-renders a 60fps)
  const initial = usePlayerStore.getState()
  const { name, avatarUrl } = initial
  const initials = getInitials(name || 'Tú')

  useEffect(() => {
    const pos   = posRef.current
    const float = floatRef.current
    const svg   = svgRef.current
    if (!pos || !float || !svg) return

    // Posición y estado inicial
    const s0 = usePlayerStore.getState()
    pos.style.left    = `${s0.x - SPRITE_OFFSET_X}px`
    pos.style.top     = `${s0.y - SPRITE_OFFSET_Y}px`
    svg.dataset.dir    = s0.direction
    svg.dataset.moving = String(s0.isMoving)

    const unsub = usePlayerStore.subscribe((s, prev) => {
      // Posición (60fps mientras se mueve)
      if (s.x !== prev.x || s.y !== prev.y) {
        pos.style.left = `${s.x - SPRITE_OFFSET_X}px`
        pos.style.top  = `${s.y - SPRITE_OFFSET_Y}px`
      }

      // Dirección → backpack CSS
      if (s.direction !== prev.direction) {
        svg.dataset.dir = s.direction
      }

      // Moving → walk hop vs idle breathe
      if (s.isMoving !== prev.isMoving) {
        svg.dataset.moving    = String(s.isMoving)
        float.style.animation = s.isMoving
          ? `avatarWalk ${MOTION.WALK_DURATION} ${MOTION.WALK_EASING} infinite`
          : `avatarIdle ${MOTION.IDLE_DURATION} ${MOTION.IDLE_EASING} infinite`
      }
    })

    return unsub
  }, [])

  return (
    <div
      ref={posRef}
      style={{
        position:      'absolute',
        left:          initial.x - SPRITE_OFFSET_X,
        top:           initial.y - SPRITE_OFFSET_Y,
        width:         SPRITE_W,
        height:        SPRITE_H,
        zIndex:        25,
        pointerEvents: 'none',
        willChange:    'left, top',
      }}
    >
      {/* ── Float/walk container ─────────────────────────── */}
      <div
        ref={floatRef}
        style={{
          position:   'absolute',
          inset:      0,
          animation:  `avatarIdle ${MOTION.IDLE_DURATION} ${MOTION.IDLE_EASING} infinite`,
          willChange: 'transform',
        }}
      >
        {/* ── Speaking indicator (voz propia, LiveKit) ─────── */}
        <PresenceIndicator
          activity={isSpeaking && !isMuted ? 'speaking' : 'idle'}
          size={SPRITE_W}
        />

        {/* ── Work mode aura ──────────────────────────────── */}
        <StatusAura mode={workMode} />

        {/* ── Reaction bubble ─────────────────────────────── */}
        <ReactionBubble emoji={localReaction} />

        {/* ── Blob sprite ─────────────────────────────────── */}
        <AvatarSprite
          ref={svgRef}
          color={PLAYER_COLOR}
          initials={initials}
          isPlayer
        />

        {/* ── Foto de perfil Clerk — badge en el visor ─────── */}
        {avatarUrl && (
          <div
            style={{
              position:     'absolute',
              top:          6,
              left:         '50%',
              transform:    'translateX(-50%)',
              width:        16,
              height:       13,
              borderRadius: '7px',
              overflow:     'hidden',
              opacity:      0.92,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* ── Status dot (siempre verde — jugador local siempre online) */}
        <div
          style={{
            position:     'absolute',
            width:         8,
            height:        8,
            bottom:        3,
            right:         4,
            borderRadius:  '50%',
            background:    '#4ade80',
            boxShadow:     '0 0 0 1.5px var(--color-bg-primary), 0 0 8px rgba(74,222,128,0.65)',
          }}
        />
      </div>

      {/* ── Nombre — fuera del float para no botar ──────────── */}
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
            display:         'inline-flex',
            alignItems:      'center',
            padding:         '2px 7px',
            borderRadius:    '999px',
            fontSize:        '10px',
            fontWeight:      700,
            lineHeight:      '15px',
            letterSpacing:   '0.01em',
            background:      'rgba(124,58,237,0.90)',
            color:           '#FFFFFF',
            boxShadow:       '0 1px 4px rgba(0,0,0,0.30)',
            backdropFilter:  'blur(6px)',
            whiteSpace:      'nowrap',
          }}
        >
          {isMuted && <span style={{ marginRight: 2, fontSize: 8 }}>🔇</span>}
          Tú
        </span>
      </div>
    </div>
  )
}
