'use client'

// UserInteractionCard — Mini card de interacción espacial (Gather/Slack style)
//
// Aparece cuando el usuario hace click sobre un peer o NPC en el mapa.
//
// Arquitectura:
//   · Renderiza DENTRO de TransformWrapper (fuera de TransformComponent) → screen space
//   · Usa useTransformContext para convertir world pos → screen pos
//   · Selectores granulares en useSpatialStore → evita "update while rendering"
//   · usePeerData con hooks siempre en el mismo orden → no viola Rules of Hooks
//
// Iconografía: Lucide React — stroke 1.75, size consistente en toda la UI
// Diseño: gamificado/social — hover con glow, microinteracciones, profundidad

import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { useTransformContext }               from 'react-zoom-pan-pinch'
import { MessageCircle, Phone, Bell, BellRing, User, X, MapPin } from 'lucide-react'
import { useSpatialStore }                   from '@/store/spatial.store'
import { useRealtimeStore }                  from '@/store/realtime.store'
import { useInteractionStore }               from '@/store/interaction.store'
import { sendInteractionEvent }              from '@/lib/interaction-events'
import { MOCK_USERS }                        from '@/lib/mock-data'
import { MOCK_PRESENCE, PRESENCE_LABELS, type PresenceActivity } from '@/lib/presence'
import { getBlobColor }                      from '@/lib/visual-system'
import { getInitials, SPRITE_H }             from './AvatarSprite'
import { UserStatus }                        from '@/types'
import { playKnockSound }                    from '@/lib/knock-sound'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { dot: string; label: string }> = {
  [UserStatus.AVAILABLE]:  { dot: '#4ade80', label: 'Disponible'   },
  [UserStatus.BUSY]:       { dot: '#f59e0b', label: 'Ocupado'      },
  [UserStatus.IN_MEETING]: { dot: '#f43f5e', label: 'En reunión'   },
  [UserStatus.AWAY]:       { dot: '#94a3b8', label: 'Ausente'      },
  [UserStatus.OFFLINE]:    { dot: '#6b7280', label: 'Desconectado' },
}
const STATUS_DEFAULT = { dot: '#6b7280', label: 'Desconectado' }

// ─── Card dimensions ──────────────────────────────────────────────────────────

const CARD_W = 232

// ─── Peer data type ───────────────────────────────────────────────────────────

type PeerData = {
  name:      string
  avatarUrl: string | null
  status:    UserStatus
  workMode:  string | null
  zoneId:    string | null
  isNpc:     boolean
  activity:  PresenceActivity | null
}

// ─── Peer data resolver ───────────────────────────────────────────────────────
//
// Todos los hooks siempre en el mismo orden — sin early returns antes de hooks.
// useRealtimeStore se llama incondicionalmente; el selector devuelve undefined
// para NPCs y null-peerId (Zustand solo re-renderiza si el valor cambia).

function usePeerData(peerId: string | null, isNpc: boolean): PeerData | null {
  const peer = useRealtimeStore((s) =>
    peerId && !isNpc ? s.peers[peerId] : undefined
  )

  return useMemo<PeerData | null>(() => {
    if (!peerId) return null

    if (isNpc) {
      const mock = MOCK_USERS.find((u) => u.id === peerId)
      if (!mock) return null
      return {
        name:      mock.name,
        avatarUrl: mock.avatarUrl,
        status:    mock.status,
        workMode:  null,
        zoneId:    null,
        isNpc:     true,
        activity:  MOCK_PRESENCE[peerId] ?? 'idle',
      }
    }

    if (!peer) return null
    return {
      name:      peer.name,
      avatarUrl: peer.avatarUrl,
      status:    peer.status,
      workMode:  peer.workMode,
      zoneId:    peer.zoneId,
      isNpc:     false,
      activity:  null,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId, isNpc, peer])
}

// ─── Action Button ────────────────────────────────────────────────────────────
//
// Hover via DOM mutation (onMouseEnter/Leave) — 0 re-renders por hover.
// Glow codificado por acción: violet=Mensaje, blue=Llamar, amber=Tocar, gray=Perfil.

interface ActionBtnProps {
  icon:       React.ReactNode
  label:      string
  onClick?:   () => void
  disabled?:  boolean
  // Color del glow y del icono en hover (CSS color string)
  glowRgba?:  string
  hoverBg?:   string
  defaultBg?: string
}

function ActionBtn({
  icon, label, onClick, disabled = false,
  glowRgba  = 'rgba(107,114,128,0.22)',
  hoverBg   = 'rgba(107,114,128,0.10)',
  defaultBg = 'rgba(0,0,0,0.05)',
}: ActionBtnProps) {
  const ref = useRef<HTMLButtonElement>(null)

  return (
    <button
      ref={ref}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={disabled ? 'Próximamente' : label}
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            5,
        padding:        '9px 8px 8px',
        borderRadius:   10,
        border:         'none',
        cursor:         disabled ? 'not-allowed' : 'pointer',
        background:     defaultBg,
        opacity:        disabled ? 0.35 : 1,
        transition:     'transform 0.13s, box-shadow 0.13s, background 0.13s',
        flex:           1,
        minWidth:       0,
        outline:        'none',
      }}
      onMouseEnter={() => {
        if (disabled || !ref.current) return
        ref.current.style.background  = hoverBg
        ref.current.style.transform   = 'translateY(-2px)'
        ref.current.style.boxShadow   = `0 4px 14px ${glowRgba}`
      }}
      onMouseLeave={() => {
        if (!ref.current) return
        ref.current.style.background  = defaultBg
        ref.current.style.transform   = ''
        ref.current.style.boxShadow   = ''
      }}
      onMouseDown={() => {
        if (disabled || !ref.current) return
        ref.current.style.transform = 'translateY(0px) scale(0.97)'
      }}
      onMouseUp={() => {
        if (disabled || !ref.current) return
        ref.current.style.transform = 'translateY(-2px)'
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </span>
      <span style={{
        fontSize:   9,
        fontWeight: 600,
        color:      'var(--color-text-tertiary, #475467)',
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
      }}>
        {label}
      </span>
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UserInteractionCard() {
  // Selectores granulares — cada uno re-renderiza solo con SU valor.
  // Evita el "Cannot update while rendering" que ocurre al suscribir al store completo.
  const selectedPeerId  = useSpatialStore((s) => s.selectedPeerId)
  const selectedPeerPos = useSpatialStore((s) => s.selectedPeerPos)
  const selectedIsNpc   = useSpatialStore((s) => s.selectedIsNpc)
  const setSelected     = useSpatialStore((s) => s.setSelected)
  const sendKnock       = useSpatialStore((s) => s.sendKnock)

  const openChat        = useInteractionStore((s) => s.openChat)

  const context = useTransformContext()
  const cardRef = useRef<HTMLDivElement>(null)

  // Estado local: feedback visual de knock enviado (2s)
  const [knockSent, setKnockSent] = useState(false)

  // Cerrar con Escape o click fuera
  const close = useCallback(() => setSelected(null), [setSelected])

  useEffect(() => {
    if (!selectedPeerId) return
    // Reset knock feedback cuando se abre una nueva card
    setKnockSent(false)

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    const onClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) close()
    }

    // Delay para no cerrar en el mismo click que abrió
    const t = setTimeout(() => {
      window.addEventListener('keydown',    onKey)
      document.addEventListener('mousedown', onClickOutside)
    }, 80)

    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown',    onKey)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [selectedPeerId, close])

  // Resolver datos del peer/NPC — hooks siempre en el mismo orden
  const data = usePeerData(selectedPeerId, selectedIsNpc)

  if (!selectedPeerId || !selectedPeerPos || !data) return null

  // ── World pos → screen pos ────────────────────────────────────────────────
  const { scale, positionX, positionY } = context.state
  const screenX = selectedPeerPos.x * scale + positionX
  const screenY = selectedPeerPos.y * scale + positionY

  const avatarScreenH = SPRITE_H * scale
  const CARD_H_APPROX = 164
  let cardTop  = screenY - avatarScreenH - CARD_H_APPROX - 12
  let cardLeft = screenX - CARD_W / 2

  cardLeft = Math.max(8, Math.min(cardLeft,
    (typeof window !== 'undefined' ? window.innerWidth : 1200) - CARD_W - 8
  ))
  cardTop = Math.max(8, cardTop)

  // ── Datos derivados ───────────────────────────────────────────────────────
  const color     = getBlobColor(selectedPeerId)
  const initials  = getInitials(data.name)
  const statusCfg = STATUS_CFG[data.status] ?? STATUS_DEFAULT

  const zoneName = data.zoneId
    ? data.zoneId.charAt(0).toUpperCase() + data.zoneId.slice(1).replace('-', ' ')
    : data.isNpc ? 'Oficina' : 'Corredor'

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleMessage = () => {
    if (!selectedPeerId || !data) return
    openChat(selectedPeerId, data.name)
    close()
  }

  const handleCall = () => {
    if (!selectedPeerId || data?.isNpc) return
    sendInteractionEvent({ type: 'call_request' }, [selectedPeerId]).catch(console.warn)
    close()
  }

  const handleKnock = () => {
    if (knockSent || !selectedPeerId) return
    // Visual en el mapa (muestra KnockIndicator en el sprite)
    sendKnock(selectedPeerId)
    // Entrega al peer remoto vía LiveKit
    sendInteractionEvent({ type: 'knock' }, [selectedPeerId]).catch(console.warn)
    // Sonido local
    playKnockSound()
    setKnockSent(true)
    setTimeout(() => setKnockSent(false), 2000)
  }

  return (
    <div
      ref={cardRef}
      className="pointer-events-auto"
      style={{
        position:  'absolute',
        left:      cardLeft,
        top:       cardTop,
        width:     CARD_W,
        zIndex:    50,
        animation: 'spatialCardIn 0.24s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}
    >
      {/* ── Card container ──────────────────────────────────────────────────── */}
      <div
        style={{
          background:     'var(--color-bg-primary, #FFFFFF)',
          border:         '1px solid var(--color-border-secondary, rgba(0,0,0,0.09))',
          borderRadius:   16,
          boxShadow:      '0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
          overflow:       'hidden',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* ── Color accent bar (4px — más presencia visual) ─────────────────── */}
        <div style={{
          height:     4,
          background: `linear-gradient(90deg, ${color.body}, ${color.dark}cc)`,
        }} />

        {/* ── Identity section ────────────────────────────────────────────── */}
        <div style={{ padding: '14px 14px 11px', display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Avatar con glow ring del color del peer */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width:          44,
              height:         44,
              borderRadius:   '50%',
              background:     `linear-gradient(145deg, ${color.body}, ${color.dark})`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              boxShadow:      `0 0 0 3px ${color.body}18, 0 0 16px ${color.body}30`,
              position:       'relative',
              overflow:       'hidden',
            }}>
              {data.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.avatarUrl}
                  alt={data.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{
                  fontSize:      14,
                  fontWeight:    800,
                  color:         '#fff',
                  letterSpacing: '-0.5px',
                  userSelect:    'none',
                }}>
                  {initials}
                </span>
              )}
            </div>

            {/* Status dot (encima del avatar, esquina inferior derecha) */}
            <div style={{
              position:     'absolute',
              bottom:       1,
              right:        1,
              width:        10,
              height:       10,
              borderRadius: '50%',
              background:   statusCfg.dot,
              border:       '2px solid var(--color-bg-primary, #fff)',
              boxShadow:    `0 0 6px ${statusCfg.dot}80`,
            }} />
          </div>

          {/* Name + status + zona */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin:       0,
              lineHeight:   1.2,
              fontSize:     13.5,
              fontWeight:   700,
              color:        'var(--color-text-primary, #101828)',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
              letterSpacing:'-0.01em',
            }}>
              {data.name}
            </p>

            <span style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          4,
              marginTop:    3,
              fontSize:     10,
              fontWeight:   500,
              color:        'var(--color-text-tertiary, #475467)',
            }}>
              {statusCfg.label}
            </span>

            {/* Zona actual con MapPin */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
              <MapPin size={9} strokeWidth={2} color="var(--color-text-quaternary, #9CA3AF)" />
              <span style={{
                fontSize:     9,
                fontWeight:   500,
                color:        'var(--color-text-quaternary, #9CA3AF)',
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap',
              }}>
                {zoneName}
              </span>
            </div>
          </div>

          {/* Close button — X icon */}
          <button
            onClick={close}
            style={{
              flexShrink:     0,
              alignSelf:      'flex-start',
              width:          24,
              height:         24,
              border:         '1px solid var(--color-border-secondary, rgba(0,0,0,0.09))',
              borderRadius:   7,
              background:     'transparent',
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              color:          'var(--color-text-quaternary, #9CA3AF)',
              transition:     'all 0.12s',
              outline:        'none',
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget
              b.style.background = 'rgba(0,0,0,0.07)'
              b.style.color      = 'var(--color-text-secondary, #344054)'
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget
              b.style.background = 'transparent'
              b.style.color      = 'var(--color-text-quaternary, #9CA3AF)'
            }}
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <div style={{
          height:     1,
          margin:     '0 14px',
          background: 'var(--color-border-secondary, rgba(0,0,0,0.06))',
        }} />

        {/* ── Quick actions ────────────────────────────────────────────────── */}
        <div style={{ padding: '10px 12px 12px', display: 'flex', gap: 6 }}>

          {/* Mensaje — acción primaria, violet */}
          <ActionBtn
            icon={<MessageCircle size={17} strokeWidth={1.75} color="#7C3AED" />}
            label="Mensaje"
            defaultBg="rgba(124,58,237,0.08)"
            hoverBg="rgba(124,58,237,0.15)"
            glowRgba="rgba(124,58,237,0.28)"
            disabled={data.isNpc}
            onClick={handleMessage}
          />

          {/* Llamar — audio call (disabled para NPC y Fase C) */}
          <ActionBtn
            icon={<Phone size={17} strokeWidth={1.75} color={data.isNpc ? '#94a3b8' : '#3b82f6'} />}
            label="Llamar"
            defaultBg={data.isNpc ? 'rgba(0,0,0,0.04)' : 'rgba(59,130,246,0.07)'}
            hoverBg="rgba(59,130,246,0.13)"
            glowRgba="rgba(59,130,246,0.26)"
            disabled={data.isNpc}
            onClick={handleCall}
          />

          {/* Tocar puerta — reemplaza "Invitar", amber, muestra feedback visual */}
          <ActionBtn
            icon={knockSent
              ? <BellRing size={17} strokeWidth={1.75} color="#f59e0b" />
              : <Bell     size={17} strokeWidth={1.75} color={knockSent ? '#f59e0b' : '#d97706'} />
            }
            label={knockSent ? '¡Enviado!' : 'Tocar'}
            defaultBg={knockSent ? 'rgba(245,158,11,0.14)' : 'rgba(217,119,6,0.07)'}
            hoverBg="rgba(245,158,11,0.16)"
            glowRgba="rgba(245,158,11,0.32)"
            disabled={knockSent}
            onClick={handleKnock}
          />

          {/* Perfil — acción secundaria */}
          <ActionBtn
            icon={<User size={17} strokeWidth={1.75} color="var(--color-text-tertiary, #475467)" />}
            label="Perfil"
            defaultBg="rgba(0,0,0,0.05)"
            hoverBg="rgba(0,0,0,0.09)"
            glowRgba="rgba(0,0,0,0.14)"
            onClick={() => {
              close()
              // TODO: abrir panel de perfil
            }}
          />
        </div>

        {/* ── NPC mood indicator ───────────────────────────────────────────── */}
        {data.isNpc && data.activity && data.activity !== 'idle' && (
          <div style={{ padding: '0 12px 11px' }}>
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          7,
              padding:      '5px 9px',
              borderRadius: 8,
              background:   'var(--color-bg-secondary, rgba(0,0,0,0.04))',
            }}>
              <span style={{ fontSize: 11 }}>
                {data.activity === 'speaking' ? '🎤' :
                 data.activity === 'typing'   ? '💬' :
                 data.activity === 'meeting'  ? '📋' : '💤'}
              </span>
              <span style={{
                fontSize:   9,
                fontWeight: 500,
                color:      'var(--color-text-secondary, #344054)',
              }}>
                {PRESENCE_LABELS[data.activity]}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Caret apuntando hacia el avatar ─────────────────────────────── */}
      <div style={{
        position:    'absolute',
        bottom:      -7,
        left:        CARD_W / 2 - 8,
        width:       0,
        height:      0,
        borderLeft:  '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop:   '8px solid var(--color-bg-primary, #FFFFFF)',
        filter:      'drop-shadow(0 3px 3px rgba(0,0,0,0.07))',
      }} />
    </div>
  )
}
