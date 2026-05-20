'use client'

// PeerAvatar — "Calm Bean" avatar de peers remotos (Visual Polish Sprint)
//
// Arquitectura rAF/lerp intacta (Phase 5). Solo cambia el visual.
// Sin flipRef — el blob es simétrico, la mochila cambia via CSS data-dir.
// svgRef.dataset.dir → backpack switch CSS (0 JS por frame de animación).

import { useRef, useEffect, useMemo } from 'react'
import { PeerPresence, onPeerPosition, useRealtimeStore } from '@/store/realtime.store'
import { Direction }   from '@/store/player.store'
import {
  AvatarSprite, SPRITE_W, SPRITE_H, SPRITE_OFFSET_X, SPRITE_OFFSET_Y,
  getInitials,
} from './AvatarSprite'
import { getBlobColor }      from '@/lib/visual-system'
import { MOTION }            from '@/lib/visual-system'
import { StatusAura }        from './StatusAura'
import { ReactionBubble }    from './ReactionBubble'
import { ProximityGlow }     from './ProximityGlow'
import { PresenceIndicator } from './PresenceIndicator'
import { KnockIndicator }    from './KnockIndicator'
import { useSpatialStore }   from '@/store/spatial.store'
import { useVoiceStore }     from '@/store/voice.store'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSpawnPosition(userId: string) {
  let h = 5381
  for (let i = 0; i < userId.length; i++) {
    h = ((h << 5) + h + userId.charCodeAt(i)) & 0x7fffffff
  }
  return { x: 100 + (h % 260), y: 80 + ((h >> 8) % 160) }
}

function getFloatParams(userId: string) {
  const seed = userId.charCodeAt(0) + userId.charCodeAt(userId.length - 1)
  return {
    dur:   MOTION.NPC_FLOAT_BASE + (seed % 7) * (MOTION.NPC_FLOAT_RANGE / 7),
    delay: (seed % 5) * 0.5,
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PeerAvatar({ peer }: { peer: PeerPresence }) {
  const color    = useMemo(() => getBlobColor(peer.userId), [peer.userId])
  const initials = useMemo(() => getInitials(peer.name),   [peer.name])
  const spawn    = useMemo(() => getSpawnPosition(peer.userId), [peer.userId])
  const { dur, delay } = useMemo(() => getFloatParams(peer.userId), [peer.userId])

  // WorkMode + reaction — re-render only on rare state changes
  const workMode = peer.workMode ?? 'available'
  const reaction = useRealtimeStore((s) => s.reactions[peer.userId])

  // Voice state — re-render solo cuando cambia isSpeaking o isMuted (poco frecuente)
  const isSpeaking = useVoiceStore((s) => s.peerVoice[peer.userId]?.isSpeaking ?? false)
  const isMuted    = useVoiceStore((s) => s.peerVoice[peer.userId]?.isMuted    ?? false)

  const wrapperRef  = useRef<HTMLDivElement>(null)
  const floatRef    = useRef<HTMLDivElement>(null)
  const svgRef      = useRef<SVGSVGElement>(null)
  const currentPos  = useRef({ x: spawn.x, y: spawn.y })  // world pos actual (para card)
  const setSelected = useSpatialStore.getState().setSelected
  const setHovered  = useSpatialStore.getState().setHovered

  useEffect(() => {
    const current = { x: spawn.x, y: spawn.y }
    const target  = { x: spawn.x, y: spawn.y }
    let curDir:    Direction = 'down'
    let curMoving            = false
    let prevDir:   Direction = 'down'
    let prevMoving           = false

    const unsub = onPeerPosition(peer.userId, (x, y, direction, isMoving) => {
      target.x  = x
      target.y  = y
      curDir    = direction
      curMoving = isMoving
    })

    let rafId: number

    const tick = () => {
      // Lerp de posición (~80ms de lag — oculta latencia Supabase)
      current.x += (target.x - current.x) * MOTION.LERP
      current.y += (target.y - current.y) * MOTION.LERP

      // Exponer posición actual para la card de interacción
      currentPos.current = { x: current.x, y: current.y }

      if (wrapperRef.current) {
        wrapperRef.current.style.left = `${current.x - SPRITE_OFFSET_X}px`
        wrapperRef.current.style.top  = `${current.y - SPRITE_OFFSET_Y}px`
      }

      const dirChanged    = curDir    !== prevDir
      const movingChanged = curMoving !== prevMoving

      if (dirChanged || movingChanged) {
        // Dirección → CSS backpack switch (sin scaleX — blob simétrico)
        if (svgRef.current) {
          if (dirChanged)    svgRef.current.dataset.dir    = curDir
          if (movingChanged) svgRef.current.dataset.moving = String(curMoving)
        }
        // Walk hop vs idle
        if (floatRef.current && movingChanged) {
          floatRef.current.style.animation = curMoving
            ? `avatarWalk ${MOTION.WALK_DURATION} ${MOTION.WALK_EASING} infinite`
            : `npcFloat ${dur}s ${MOTION.IDLE_EASING} ${delay}s infinite`
        }
        prevDir    = curDir
        prevMoving = curMoving
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => { unsub(); cancelAnimationFrame(rafId) }
  }, [peer.userId, spawn.x, spawn.y, dur, delay])

  const entryAnim = peer.isLeaving
    ? `peerLeave ${MOTION.LEAVE_DURATION} ease-in forwards`
    : `peerEnter ${MOTION.ENTER_DURATION} ${MOTION.ENTER_EASING} forwards`

  return (
    <div
      ref={wrapperRef}
      style={{
        position:      'absolute',
        left:          spawn.x - SPRITE_OFFSET_X,
        top:           spawn.y - SPRITE_OFFSET_Y,
        width:         SPRITE_W,
        height:        SPRITE_H,
        zIndex:        23,
        pointerEvents: 'auto',   // ← habilitado para interacción espacial
        animation:     entryAnim,
        cursor:        'pointer',
      }}
      onClick={() => setSelected(peer.userId, { ...currentPos.current })}
      onMouseEnter={() => setHovered(peer.userId)}
      onMouseLeave={() => setHovered(null)}
    >
      {/* ── Proximity glow (world space, escala con zoom) ─── */}
      <ProximityGlow userId={peer.userId} color={color} />

      {/* ── Knock indicator (badge bell — desaparece en 2.5s) ─ */}
      <KnockIndicator userId={peer.userId} />

      {/* ── Float/walk container ─────────────────────────── */}
      <div
        ref={floatRef}
        style={{
          position:   'absolute',
          inset:      0,
          animation:  `npcFloat ${dur}s ease-in-out ${delay}s infinite`,
          willChange: 'transform',
        }}
      >
        {/* Peer ring — identifies this as a real remote user (vs NPC) */}
        <div
          aria-hidden
          style={{
            position:     'absolute',
            inset:        -2,
            borderRadius: 16,
            boxShadow:    '0 0 0 1.5px rgba(96,165,250,0.40)',
            pointerEvents:'none',
          }}
        />

        {/* ── Speaking indicator (LiveKit voice) ──────────── */}
        <PresenceIndicator
          activity={isSpeaking ? 'speaking' : 'idle'}
          size={SPRITE_W}
        />

        {/* ── Work mode aura ──────────────────────────────── */}
        <StatusAura mode={workMode} />

        {/* ── Reaction bubble ─────────────────────────────── */}
        <ReactionBubble emoji={reaction} />

        {/* ── Blob sprite ─────────────────────────────────── */}
        <AvatarSprite
          ref={svgRef}
          color={color}
          initials={initials}
        />

        {/* Foto badge si el peer tiene foto de Clerk */}
        {peer.avatarUrl && (
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
              opacity:      0.88,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={peer.avatarUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* ── Nombre — fuera del float ─────────────────────── */}
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
          {isMuted && (
            <span style={{ marginRight: 2, fontSize: 8 }}>🔇</span>
          )}
          {peer.name.split(' ')[0]}
        </span>
      </div>
    </div>
  )
}
