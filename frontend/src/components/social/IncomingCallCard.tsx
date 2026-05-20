'use client'

// IncomingCallCard — notificación de llamada entrante
//
// Aparece cuando un peer envía un call_request.
// Diseño: in-game / social — no modal corporativo.
// Posición: centro-superior del mapa (screen space).
// Animación: slide-in con spring, ring pulsante en el avatar.

import { PhoneCall, PhoneOff } from 'lucide-react'
import { useInteractionStore } from '@/store/interaction.store'
import { getBlobColor }        from '@/lib/visual-system'
import { soundManager }        from '@/lib/ui-sounds'

export function IncomingCallCard() {
  const incomingCall = useInteractionStore((s) => s.incomingCall)
  const acceptCall   = useInteractionStore((s) => s.acceptCall)
  const declineCall  = useInteractionStore((s) => s.declineCall)

  if (!incomingCall) return null

  const color = getBlobColor(incomingCall.fromId)

  const handleAccept = () => {
    soundManager.stopIncomingCall()
    soundManager.playCallAccepted()
    acceptCall()
  }

  const handleDecline = () => {
    soundManager.stopIncomingCall()
    soundManager.playCallDeclined()
    declineCall()
  }

  return (
    // Overlay semi-transparente — permite ver el mapa pero indica urgencia
    <div
      style={{
        position:       'absolute',
        inset:          0,
        display:        'flex',
        alignItems:     'flex-start',
        justifyContent: 'center',
        paddingTop:     80,
        zIndex:         70,
        background:     'rgba(0,0,0,0.18)',
        backdropFilter: 'blur(2px)',
        pointerEvents:  'auto',
      }}
      onClick={(e) => {
        // Click fuera de la card → no hacer nada (no cerrar accidentalmente)
        e.stopPropagation()
      }}
    >
      {/* Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            16,
          padding:        '28px 32px 24px',
          borderRadius:   20,
          background:     'var(--color-bg-primary, #fff)',
          border:         '1px solid var(--color-border-secondary, rgba(0,0,0,0.09))',
          boxShadow:      '0 20px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(24px)',
          animation:      'incomingCallIn 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards',
          minWidth:       240,
          textAlign:      'center',
          pointerEvents:  'auto',
        }}
      >
        {/* Avatar con ring pulsante */}
        <div style={{ position: 'relative' }}>
          {/* Ring pulsante externo */}
          <div
            aria-hidden
            style={{
              position:     'absolute',
              inset:        -10,
              borderRadius: '50%',
              border:       `2px solid ${color.body}`,
              animation:    'callRingPulse 1.8s ease-out infinite',
              opacity:      0.5,
            }}
          />
          <div
            aria-hidden
            style={{
              position:     'absolute',
              inset:        -4,
              borderRadius: '50%',
              border:       `1.5px solid ${color.body}`,
              animation:    'callRingPulse 1.8s ease-out 0.6s infinite',
              opacity:      0.7,
            }}
          />

          {/* Avatar blob */}
          <div style={{
            width:          56,
            height:         56,
            borderRadius:   '50%',
            background:     `linear-gradient(145deg, ${color.body}, ${color.dark})`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            boxShadow:      `0 0 0 3px ${color.body}20, 0 4px 16px rgba(0,0,0,0.15)`,
            overflow:       'hidden',
            position:       'relative',
          }}>
            {incomingCall.fromAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={incomingCall.fromAvatarUrl}
                alt={incomingCall.fromName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>
                {incomingCall.fromName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Name + label */}
        <div>
          <p style={{
            margin:        0,
            fontSize:      15,
            fontWeight:    700,
            color:         'var(--color-text-primary, #101828)',
            letterSpacing: '-0.01em',
          }}>
            {incomingCall.fromName}
          </p>
          <p style={{
            margin:    '4px 0 0',
            fontSize:  11,
            color:     'var(--color-text-tertiary, #475467)',
            fontWeight: 500,
          }}>
            Llamada entrante…
          </p>

          {/* Dots de audio activo */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 10 }}>
            {[0, 0.2, 0.4].map((delay) => (
              <div
                key={delay}
                style={{
                  width:        5,
                  height:       5,
                  borderRadius: '50%',
                  background:   color.body,
                  animation:    `typingDot 1.1s ease-in-out ${delay}s infinite`,
                  opacity:      0.7,
                }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          {/* Rechazar */}
          <button
            onClick={handleDecline}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            7,
              padding:        '10px 20px',
              borderRadius:   10,
              border:         'none',
              background:     'rgba(239,68,68,0.10)',
              color:          '#ef4444',
              fontWeight:     600,
              fontSize:       13,
              cursor:         'pointer',
              transition:     'all 0.13s',
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget
              b.style.background = 'rgba(239,68,68,0.18)'
              b.style.transform  = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget
              b.style.background = 'rgba(239,68,68,0.10)'
              b.style.transform  = ''
            }}
          >
            <PhoneOff size={14} strokeWidth={1.75} />
            Rechazar
          </button>

          {/* Aceptar */}
          <button
            onClick={handleAccept}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            7,
              padding:        '10px 20px',
              borderRadius:   10,
              border:         'none',
              background:     'rgba(74,222,128,0.12)',
              color:          '#16a34a',
              fontWeight:     600,
              fontSize:       13,
              cursor:         'pointer',
              transition:     'all 0.13s',
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget
              b.style.background = 'rgba(74,222,128,0.22)'
              b.style.transform  = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget
              b.style.background = 'rgba(74,222,128,0.12)'
              b.style.transform  = ''
            }}
          >
            <PhoneCall size={14} strokeWidth={1.75} />
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
