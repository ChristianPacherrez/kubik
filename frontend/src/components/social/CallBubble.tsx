'use client'

// CallBubble — burbuja flotante de llamada activa
//
// Posición: absolute bottom: 80px, left: 16px (encima de MapControls)
// Sólo visible cuando activeCallId !== null.
//
// Estados:
//   Expandido (280px) — avatar + nombre + timer + controles
//   Minimizado (pill)  — icono + nombre abreviado + mute + end
//
// Animación de entrada: callBubbleIn (spring desde abajo)
// Aura de llamada:      callAuraPulse (2 anillos offset)
// Dot "en llamada":     callActiveDot (green pulse)
//
// Diseño inspirado en Discord Call Overlay + Slack Calls.
// El mapa permanece visible y navegable en todo momento.

import { CSSProperties, useEffect, useState } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Minus, MonitorUp, MonitorOff } from 'lucide-react'
import { useInteractionStore } from '@/store/interaction.store'
import { useVoiceStore }       from '@/store/voice.store'
import { getBlobColor }        from '@/lib/visual-system'
import { toggleMute, setCameraEnabled, setScreenShareEnabled } from '@/lib/livekit'

// ─── Elapsed timer hook ───────────────────────────────────────────────────────

function useCallTimer(startedAt: number | null): string {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0)
      return
    }
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  const m = Math.floor(elapsed / 60).toString().padStart(2, '0')
  const s = (elapsed % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ─── CallBubble ───────────────────────────────────────────────────────────────

export function CallBubble() {
  const activeCallId   = useInteractionStore((s) => s.activeCallId)
  const peerName       = useInteractionStore((s) => s.activeCallPeerName)
  const peerAvatarUrl  = useInteractionStore((s) => s.activeCallPeerAvatarUrl)
  const callStartedAt  = useInteractionStore((s) => s.callStartedAt)
  const isMinimized    = useInteractionStore((s) => s.isCallMinimized)
  const minimizeCall   = useInteractionStore((s) => s.minimizeCall)
  const endCall        = useInteractionStore((s) => s.endCall)

  const isMuted          = useVoiceStore((s) => s.isMuted)
  const isCameraEnabled  = useVoiceStore((s) => s.isCameraEnabled)
  const cameraState      = useVoiceStore((s) => s.cameraState)
  const isScreenSharing  = useVoiceStore((s) => s.isScreenSharing)
  const screenShareState = useVoiceStore((s) => s.screenShareState)

  const elapsed = useCallTimer(callStartedAt)

  if (!activeCallId) return null

  const name  = peerName ?? activeCallId
  const color = getBlobColor(activeCallId)

  const handleToggleMute        = () => toggleMute().catch(console.warn)
  const handleToggleCamera      = () => setCameraEnabled(!isCameraEnabled).catch(console.warn)
  const handleToggleScreenShare = () => setScreenShareEnabled(!isScreenSharing).catch(console.warn)

  // ── Avatar element — reutilizado en ambos estados ─────────────────────────

  const avatarEl = (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Aura ring 1 — base */}
      <div aria-hidden style={{
        position:     'absolute',
        inset:        -10,
        borderRadius: '50%',
        border:       `1.5px solid #22c55e`,
        animation:    'callAuraPulse 2.4s ease-out infinite',
      }} />
      {/* Aura ring 2 — offset 0.8s */}
      <div aria-hidden style={{
        position:     'absolute',
        inset:        -4,
        borderRadius: '50%',
        border:       `1.5px solid #22c55e`,
        animation:    'callAuraPulse 2.4s ease-out 0.8s infinite',
      }} />

      {/* Avatar blob */}
      <div style={{
        width:          48,
        height:         48,
        borderRadius:   '50%',
        background:     `linear-gradient(145deg, ${color.body}, ${color.dark})`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        boxShadow:      `0 0 0 2.5px ${color.body}25, 0 4px 12px rgba(0,0,0,0.14)`,
        overflow:       'hidden',
        position:       'relative',
      }}>
        {peerAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={peerAvatarUrl}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  )

  // ── Minimized pill ────────────────────────────────────────────────────────

  if (isMinimized) {
    return (
      <div
        style={{
          position:       'absolute',
          bottom:         80,
          left:           16,
          zIndex:         50,
          display:        'flex',
          alignItems:     'center',
          gap:            6,
          height:         40,
          padding:        '0 8px 0 6px',
          borderRadius:   20,
          background:     'var(--color-bg-primary, #fff)',
          border:         '1px solid var(--color-border-secondary, rgba(0,0,0,0.09))',
          borderLeft:     '2.5px solid #22c55e',
          boxShadow:      '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
          backdropFilter: 'blur(20px)',
          animation:      'callBubbleIn 0.34s cubic-bezier(0.34,1.56,0.64,1) forwards',
          pointerEvents:  'auto',
          userSelect:     'none',
        }}
      >
        {/* Green phone icon */}
        <div style={{
          width:         28,
          height:        28,
          borderRadius:  '50%',
          background:    'rgba(34,197,94,0.12)',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          flexShrink:    0,
        }}>
          <Phone size={13} strokeWidth={2} color="#22c55e" />
        </div>

        {/* Name + timer */}
        <span
          role="button"
          onClick={() => minimizeCall(false)}
          style={{
            fontSize:   12,
            fontWeight: 600,
            color:      'var(--color-text-primary, #101828)',
            whiteSpace: 'nowrap',
            cursor:     'pointer',
            paddingRight: 2,
          }}
        >
          {name.split(' ')[0]} · {elapsed}
        </span>

        {/* Mute */}
        <button
          onClick={handleToggleMute}
          title={isMuted ? 'Desmutear' : 'Silenciar'}
          style={pillBtn(isMuted ? 'rgba(239,68,68,0.10)' : 'rgba(0,0,0,0.06)')}
        >
          {isMuted
            ? <MicOff size={11} strokeWidth={2} color="#ef4444" />
            : <Mic    size={11} strokeWidth={2} color="var(--color-text-tertiary, #475467)" />
          }
        </button>

        {/* Video */}
        <button
          onClick={handleToggleCamera}
          title={isCameraEnabled ? 'Desactivar cámara' : 'Activar video'}
          style={pillBtn(isCameraEnabled ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.06)')}
        >
          {isCameraEnabled
            ? <Video    size={11} strokeWidth={2} color="#6366f1" />
            : <VideoOff size={11} strokeWidth={2} color="var(--color-text-tertiary, #475467)" />
          }
        </button>

        {/* Screen share */}
        <button
          onClick={handleToggleScreenShare}
          title={isScreenSharing ? 'Dejar de compartir' : 'Compartir pantalla'}
          style={pillBtn(isScreenSharing ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.06)')}
        >
          {isScreenSharing
            ? <MonitorOff size={11} strokeWidth={2} color="#6366f1" />
            : <MonitorUp  size={11} strokeWidth={2} color="var(--color-text-tertiary, #475467)" />
          }
        </button>

        {/* End */}
        <button
          onClick={endCall}
          title="Finalizar llamada"
          style={pillBtn('rgba(239,68,68,0.10)')}
        >
          <PhoneOff size={11} strokeWidth={2} color="#ef4444" />
        </button>
      </div>
    )
  }

  // ── Expanded bubble ───────────────────────────────────────────────────────

  return (
    <div
      style={{
        position:       'absolute',
        bottom:         80,
        left:           16,
        zIndex:         50,
        width:          280,
        borderRadius:   18,
        background:     'var(--color-bg-primary, #fff)',
        border:         '1px solid var(--color-border-secondary, rgba(0,0,0,0.09))',
        borderLeft:     '3px solid #22c55e',
        boxShadow:      '0 16px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)',
        backdropFilter: 'blur(24px)',
        overflow:       'hidden',
        animation:      'callBubbleIn 0.34s cubic-bezier(0.34,1.56,0.64,1) forwards',
        pointerEvents:  'auto',
        userSelect:     'none',
      }}
    >
      {/* ── Header strip ──────────────────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '10px 12px 8px 14px',
        borderBottom:   '1px solid var(--color-border-secondary, rgba(0,0,0,0.07))',
      }}>
        {/* "En llamada" con dot verde animado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width:        7,
            height:       7,
            borderRadius: '50%',
            background:   '#22c55e',
            animation:    'callActiveDot 2.4s ease-in-out infinite',
            flexShrink:   0,
          }} />
          <span style={{
            fontSize:      10,
            fontWeight:    600,
            color:         '#16a34a',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            En llamada
          </span>
        </div>

        {/* Minimize */}
        <button
          onClick={() => minimizeCall(true)}
          title="Minimizar"
          style={{
            width:          22,
            height:         22,
            borderRadius:   6,
            border:         'none',
            background:     'transparent',
            cursor:         'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            color:          'var(--color-text-quaternary, #9CA3AF)',
            transition:     'background 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <Minus size={12} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Avatar + identity ──────────────────────────────────────────────── */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        14,
        padding:    '16px 14px 10px',
      }}>
        {avatarEl}

        {/* Name + status + timer */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin:        0,
            fontSize:      14,
            fontWeight:    700,
            color:         'var(--color-text-primary, #101828)',
            overflow:      'hidden',
            textOverflow:  'ellipsis',
            whiteSpace:    'nowrap',
            letterSpacing: '-0.01em',
          }}>
            {name}
          </p>
          <p style={{
            margin:     '2px 0 0',
            fontSize:   11,
            color:      'var(--color-text-tertiary, #475467)',
            fontWeight: 500,
          }}>
            📞 Llamada activa
          </p>
          {/* Timer tabular — siempre mismo ancho */}
          <p style={{
            margin:             '4px 0 0',
            fontSize:           15,
            fontWeight:         700,
            color:              '#16a34a',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing:      '0.04em',
          }}>
            {elapsed}
          </p>
        </div>
      </div>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <div style={{
        display:  'flex',
        gap:      8,
        padding:  '0 14px 16px',
        flexWrap: 'wrap',
      }}>
        {/* Mute / Unmute */}
        <button
          onClick={handleToggleMute}
          title={isMuted ? 'Desmutear micrófono' : 'Silenciar micrófono'}
          style={actionBtn(
            isMuted ? 'rgba(239,68,68,0.10)' : 'rgba(0,0,0,0.05)',
            isMuted ? '#ef4444' : 'var(--color-text-secondary, #344054)',
          )}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          {isMuted
            ? <MicOff size={13} strokeWidth={1.75} />
            : <Mic    size={13} strokeWidth={1.75} />
          }
          <span>{isMuted ? 'Desmutear' : 'Mutear'}</span>
        </button>

        {/* Video — funcional: activa/desactiva cámara */}
        <button
          onClick={handleToggleCamera}
          title={isCameraEnabled ? 'Desactivar cámara' : 'Activar videollamada'}
          disabled={cameraState === 'activating'}
          style={{
            ...actionBtn(
              isCameraEnabled ? 'rgba(99,102,241,0.10)' : 'rgba(0,0,0,0.05)',
              isCameraEnabled ? '#6366f1' : 'var(--color-text-secondary, #344054)',
            ),
            opacity: cameraState === 'activating' ? 0.6 : 1,
            cursor:  cameraState === 'activating' ? 'wait' : 'pointer',
          }}
          onMouseEnter={(e) => { if (cameraState !== 'activating') e.currentTarget.style.opacity = '0.75' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = cameraState === 'activating' ? '0.6' : '1' }}
        >
          {isCameraEnabled
            ? <Video    size={13} strokeWidth={1.75} />
            : <VideoOff size={13} strokeWidth={1.75} />
          }
          <span>
            {cameraState === 'activating' ? 'Activando…' : isCameraEnabled ? 'Cámara' : 'Video'}
          </span>
        </button>

        {/* Screen share */}
        <button
          onClick={handleToggleScreenShare}
          title={isScreenSharing ? 'Dejar de compartir pantalla' : 'Compartir pantalla'}
          disabled={screenShareState === 'starting'}
          style={{
            ...actionBtn(
              isScreenSharing ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.05)',
              isScreenSharing ? '#6366f1' : 'var(--color-text-secondary, #344054)',
            ),
            opacity: screenShareState === 'starting' ? 0.6 : 1,
            cursor:  screenShareState === 'starting' ? 'wait' : 'pointer',
          }}
          onMouseEnter={(e) => { if (screenShareState !== 'starting') e.currentTarget.style.opacity = '0.75' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = screenShareState === 'starting' ? '0.6' : '1' }}
        >
          {isScreenSharing
            ? <MonitorOff size={13} strokeWidth={1.75} />
            : <MonitorUp  size={13} strokeWidth={1.75} />
          }
          <span>
            {screenShareState === 'starting' ? 'Abriendo…' : isScreenSharing ? 'Pantalla' : 'Compartir'}
          </span>
        </button>

        {/* End call */}
        <button
          onClick={endCall}
          title="Finalizar llamada"
          style={actionBtn('rgba(239,68,68,0.10)', '#ef4444')}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.20)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.10)' }}
        >
          <PhoneOff size={13} strokeWidth={1.75} />
          <span>Finalizar</span>
        </button>
      </div>
    </div>
  )
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function pillBtn(bg: string): CSSProperties {
  return {
    width:          26,
    height:         26,
    borderRadius:   7,
    border:         'none',
    background:     bg,
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    padding:        0,
  }
}

function actionBtn(bg: string, color: string): CSSProperties {
  return {
    display:    'flex',
    alignItems: 'center',
    gap:        5,
    padding:    '7px 12px',
    borderRadius: 9,
    border:     'none',
    background: bg,
    color,
    fontWeight: 600,
    fontSize:   12,
    cursor:     'pointer',
    transition: 'all 0.12s',
    flexShrink: 0,
  }
}
