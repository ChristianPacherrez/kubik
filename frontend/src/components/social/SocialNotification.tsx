'use client'

// SocialNotification — toast social con identidad visual por tipo de evento
//
// Mejoras v2:
//   · Borde lateral coloreado según tipo (knock=amber, message=violet, missed=red)
//   · Icono de contexto junto al avatar (no solo texto)
//   · Barra de progreso animada indicando el tiempo de auto-dismiss
//   · Tamaño mayor — más fácil de leer y menos ignorable
//   · Sombra más pronunciada — mayor profundidad z
//
// Posición: top-center, screen space (no transforma con zoom).

import { useEffect, useRef, useState } from 'react'
import { X, Bell, MessageCircle, PhoneMissed } from 'lucide-react'
import { useInteractionStore } from '@/store/interaction.store'
import { getBlobColor }        from '@/lib/visual-system'

// Duración del auto-dismiss en ms
const DISMISS_MS = 5000

// Config visual por tipo
const TYPE_CONFIG = {
  knock: {
    accent:   '#f59e0b',        // amber
    bgAccent: 'rgba(245,158,11,0.10)',
    icon:     <Bell size={13} strokeWidth={2} color="#f59e0b" />,
    label:    'tocó tu puerta',
  },
  missed_call: {
    accent:   '#ef4444',        // red
    bgAccent: 'rgba(239,68,68,0.10)',
    icon:     <PhoneMissed size={13} strokeWidth={2} color="#ef4444" />,
    label:    'llamada perdida',
  },
  // message usa el tipo 'knock' reutilizado en el store — detectamos por prefijo
} as const

export function SocialNotification() {
  const notifications = useInteractionStore((s) => s.notifications)
  const dismiss       = useInteractionStore((s) => s.dismissNotification)
  const notification  = notifications[0]

  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [progress, setProgress] = useState(100)
  const rafRef      = useRef<number | null>(null)
  const startRef    = useRef<number>(0)

  useEffect(() => {
    if (!notification) {
      setProgress(100)
      return
    }

    // Iniciar barra de progreso
    startRef.current = Date.now()
    setProgress(100)

    const animate = () => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.max(0, 100 - (elapsed / DISMISS_MS) * 100)
      setProgress(pct)
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    rafRef.current = requestAnimationFrame(animate)

    timerRef.current = setTimeout(() => dismiss(notification.id), DISMISS_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (rafRef.current)   cancelAnimationFrame(rafRef.current)
    }
  }, [notification?.id, dismiss]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!notification) return null

  const color = getBlobColor(notification.fromId)

  // Detectar si es mensaje (fromName tiene prefijo '💬')
  const isMessage   = notification.fromName.startsWith('💬')
  const isMissedCall = notification.type === 'missed_call'

  // Nombre limpio (sin el prefijo emoji de mensaje)
  const displayName = isMessage
    ? notification.fromName.replace('💬 ', '')
    : notification.fromName

  // Config del tipo
  const cfg = isMissedCall
    ? TYPE_CONFIG.missed_call
    : TYPE_CONFIG.knock

  const accentColor = isMessage ? color.body : cfg.accent
  const typeLabel   = isMessage
    ? 'te envió un mensaje'
    : isMissedCall
    ? 'llamada perdida'
    : 'tocó tu puerta'

  const typeIcon = isMessage
    ? <MessageCircle size={13} strokeWidth={2} color={color.body} />
    : cfg.icon

  return (
    <div
      key={notification.id}
      style={{
        position:       'absolute',
        top:            20,
        left:           '50%',
        transform:      'translateX(-50%)',
        zIndex:         60,
        display:        'flex',
        flexDirection:  'column',
        borderRadius:   16,
        background:     'var(--color-bg-primary, #fff)',
        border:         '1px solid var(--color-border-secondary, rgba(0,0,0,0.09))',
        boxShadow:      '0 12px 40px rgba(0,0,0,0.20), 0 4px 12px rgba(0,0,0,0.10)',
        backdropFilter: 'blur(24px)',
        pointerEvents:  'auto',
        animation:      'socialNotifIn 0.34s cubic-bezier(0.34,1.56,0.64,1) forwards',
        overflow:       'hidden',
        minWidth:       260,
        maxWidth:       360,
        // Borde lateral de acento — identidad del tipo de notificación
        borderLeft:     `3px solid ${accentColor}`,
      }}
    >
      {/* ── Contenido principal ──────────────────────────────────────────── */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        12,
        padding:    '12px 14px 10px 12px',
      }}>
        {/* Avatar con indicador de tipo superpuesto */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width:          40,
            height:         40,
            borderRadius:   '50%',
            background:     `linear-gradient(135deg, ${color.body}, ${color.dark})`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       15,
            boxShadow:      `0 0 0 2px ${color.body}30`,
            overflow:       'hidden',
          }}>
            {notification.fromAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={notification.fromAvatarUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Badge de tipo (esquina inferior derecha del avatar) */}
          <div style={{
            position:      'absolute',
            bottom:        -2,
            right:         -2,
            width:         20,
            height:        20,
            borderRadius:  '50%',
            background:    isMessage ? color.body : isMissedCall ? '#ef4444' : '#f59e0b',
            border:        '2px solid var(--color-bg-primary, #fff)',
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
          }}>
            {isMessage
              ? <MessageCircle size={10} strokeWidth={2.5} color="#fff" />
              : isMissedCall
              ? <PhoneMissed   size={10} strokeWidth={2.5} color="#fff" />
              : <Bell          size={10} strokeWidth={2.5} color="#fff" />
            }
          </div>
        </div>

        {/* Texto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin:       0,
            fontSize:     13,
            fontWeight:   700,
            color:        'var(--color-text-primary, #101828)',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            letterSpacing:'-0.01em',
          }}>
            {displayName}
          </p>
          <p style={{
            margin:    '2px 0 0',
            fontSize:  11,
            color:     isMissedCall
              ? '#ef4444'
              : isMessage
              ? 'var(--color-text-tertiary, #475467)'
              : '#d97706',
            fontWeight: 500,
          }}>
            {typeLabel}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => dismiss(notification.id)}
          style={{
            flexShrink:     0,
            width:          26,
            height:         26,
            borderRadius:   7,
            border:         '1px solid var(--color-border-secondary, rgba(0,0,0,0.09))',
            background:     'transparent',
            cursor:         'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            color:          'var(--color-text-quaternary, #9CA3AF)',
            transition:     'all 0.12s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.06)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <X size={12} strokeWidth={2} />
        </button>
      </div>

      {/* ── Barra de progreso de auto-dismiss ────────────────────────────── */}
      <div style={{
        height:     3,
        background: 'var(--color-bg-secondary, rgba(0,0,0,0.06))',
      }}>
        <div style={{
          height:     '100%',
          width:      `${progress}%`,
          background: accentColor,
          transition: 'width 0.05s linear',
          opacity:    0.7,
        }} />
      </div>
    </div>
  )
}
