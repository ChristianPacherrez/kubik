'use client'

// VideoCallWindow — ventana flotante de videollamada + pantalla compartida
//
// Modos:
//   1. Mini window (340px) — arrastrable, bottom-right del canvas
//   2. Minimized pill       — solo nombre + icono + end call
//   3. Fullscreen overlay   — screen share protagonista, cámaras flotantes,
//                             controles en la barra inferior
//
// Prioridad de display en main:
//   peerScreen > localScreen > peerCamera > avatar
//
// PiP (en mini window):
//   screen share en main → cámara del peer o local
//   cámara en main       → preview de screen local
//
// Fullscreen disponible cuando hay screen share activo (propio o del peer).
// La oficina (mapa) sigue visible detrás cuando no está en fullscreen.

import { CSSProperties, useEffect, useRef, useState } from 'react'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Minimize2, Maximize2, GripHorizontal,
  MonitorUp, MonitorOff, X, Expand,
} from 'lucide-react'
import { useInteractionStore }  from '@/store/interaction.store'
import { useVoiceStore }        from '@/store/voice.store'
import { getBlobColor }         from '@/lib/visual-system'
import {
  toggleMute,
  setCameraEnabled,
  setScreenShareEnabled,
  getLocalVideoTrack,
  getPeerVideoTrack,
  getLocalScreenTrack,
  getPeerScreenTrack,
} from '@/lib/livekit'

// ─── VideoCallWindow ──────────────────────────────────────────────────────────

export function VideoCallWindow() {
  const activeCallId    = useInteractionStore((s) => s.activeCallId)
  const peerName        = useInteractionStore((s) => s.activeCallPeerName)
  const peerAvatarUrl   = useInteractionStore((s) => s.activeCallPeerAvatarUrl)
  const endCall         = useInteractionStore((s) => s.endCall)

  const isMuted          = useVoiceStore((s) => s.isMuted)
  const isCameraEnabled  = useVoiceStore((s) => s.isCameraEnabled)
  const cameraState      = useVoiceStore((s) => s.cameraState)
  const isScreenSharing  = useVoiceStore((s) => s.isScreenSharing)
  const screenShareState = useVoiceStore((s) => s.screenShareState)
  const peerVoice        = useVoiceStore((s) => s.peerVoice)

  const peerState          = activeCallId ? peerVoice[activeCallId] : undefined
  const peerHasVideo       = peerState?.hasVideo       ?? false
  const peerHasScreenShare = peerState?.hasScreenShare ?? false

  const [isMinimized,  setIsMinimized]  = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [drag, setDrag] = useState({ dx: 0, dy: 0 })
  const dragStart = useRef<{ mouseX: number; mouseY: number; dx: number; dy: number } | null>(null)

  // ── Video element refs ────────────────────────────────────────────────────
  const mainVideoRef  = useRef<HTMLVideoElement>(null)
  const pipVideoRef   = useRef<HTMLVideoElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)

  // ── Priority logic ────────────────────────────────────────────────────────
  const mainIs: 'peerScreen' | 'localScreen' | 'peerCamera' | 'avatar' =
    peerHasScreenShare ? 'peerScreen'
    : isScreenSharing  ? 'localScreen'
    : peerHasVideo     ? 'peerCamera'
    : 'avatar'

  const showPip = mainIs === 'peerScreen' || mainIs === 'localScreen'
  const pipIs: 'peerCamera' | 'localCamera' | 'none' =
    !showPip ? 'none'
    : mainIs === 'peerScreen'
      ? (isCameraEnabled ? 'localCamera' : peerHasVideo ? 'peerCamera' : 'none')
      : isCameraEnabled ? 'localCamera' : 'none'

  // Fullscreen disponible solo cuando hay screen share
  const canFullscreen = mainIs === 'peerScreen' || mainIs === 'localScreen'

  // Exit fullscreen automáticamente si el screen share se detiene
  useEffect(() => {
    if (isFullscreen && !canFullscreen) setIsFullscreen(false)
  }, [isFullscreen, canFullscreen])

  // ── Track attachment effects ──────────────────────────────────────────────
  // Cada efecto incluye `isFullscreen` en sus deps para re-adjuntar cuando
  // los elementos <video> se montan/desmontan al cambiar de modo.

  useEffect(() => {
    if (mainIs !== 'peerScreen' || !activeCallId) return
    const track = getPeerScreenTrack(activeCallId)
    const el    = mainVideoRef.current
    if (!track || !el) return
    track.attach(el)
    return () => { track.detach(el) }
  }, [mainIs, activeCallId, peerHasScreenShare, isFullscreen, isMinimized])

  useEffect(() => {
    if (mainIs !== 'localScreen') return
    const track = getLocalScreenTrack()
    const el    = mainVideoRef.current
    if (!track || !el) return
    track.attach(el)
    return () => { track.detach(el) }
  }, [mainIs, isScreenSharing, isFullscreen, isMinimized])

  useEffect(() => {
    if (mainIs !== 'peerCamera' || !activeCallId) return
    const track = getPeerVideoTrack(activeCallId)
    const el    = mainVideoRef.current
    if (!track || !el) return
    track.attach(el)
    return () => { track.detach(el) }
  }, [mainIs, activeCallId, peerHasVideo, isFullscreen, isMinimized])

  useEffect(() => {
    if (pipIs === 'none') return
    const track = pipIs === 'localCamera'
      ? getLocalVideoTrack()
      : activeCallId ? getPeerVideoTrack(activeCallId) : null
    const el = pipVideoRef.current
    if (!track || !el) return
    track.attach(el)
    return () => { track.detach(el) }
  }, [pipIs, activeCallId, isCameraEnabled, peerHasVideo, isFullscreen, isMinimized])

  useEffect(() => {
    if (mainIs !== 'peerCamera' || !isCameraEnabled) return
    const track = getLocalVideoTrack()
    const el    = localVideoRef.current
    if (!track || !el) return
    track.attach(el)
    return () => { track.detach(el) }
  }, [mainIs, isCameraEnabled, isFullscreen, isMinimized])

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMinimized) return
    e.preventDefault()
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, dx: drag.dx, dy: drag.dy }
    const onMove = (ev: MouseEvent) => {
      if (!dragStart.current) return
      setDrag({
        dx: dragStart.current.dx + (ev.clientX - dragStart.current.mouseX),
        dy: dragStart.current.dy + (ev.clientY - dragStart.current.mouseY),
      })
    }
    const onUp = () => {
      dragStart.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  // ── Visibilidad ───────────────────────────────────────────────────────────
  const hasAnyVideo = isCameraEnabled || peerHasVideo || isScreenSharing || peerHasScreenShare
  if (!activeCallId || !hasAnyVideo) return null

  const name  = peerName ?? activeCallId
  const color = getBlobColor(activeCallId)

  const videoAreaH = mainIs === 'peerScreen' || mainIs === 'localScreen' ? 220 : 200

  const statusLabel =
    peerHasScreenShare ? '👀 Viendo presentación'
    : isScreenSharing  ? '🖥️ Compartiendo pantalla'
    : isCameraEnabled  ? '🎥 En videollamada'
    : peerHasVideo     ? '🎥 En videollamada'
    : ''

  // ── Shared control buttons ────────────────────────────────────────────────

  const MicBtn = ({ size = 14 }: { size?: number }) => (
    <button
      onClick={() => toggleMute().catch(console.warn)}
      title={isMuted ? 'Desmutear' : 'Silenciar'}
      style={controlBtn(isMuted ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.10)')}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.72' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
    >
      {isMuted
        ? <MicOff size={size} strokeWidth={1.75} color="#ef4444" />
        : <Mic    size={size} strokeWidth={1.75} color="rgba(255,255,255,0.85)" />
      }
    </button>
  )

  const CamBtn = ({ size = 14 }: { size?: number }) => (
    <button
      onClick={() => setCameraEnabled(!isCameraEnabled).catch(console.warn)}
      title={isCameraEnabled ? 'Desactivar cámara' : 'Activar cámara'}
      disabled={cameraState === 'activating'}
      style={{
        ...controlBtn(isCameraEnabled ? 'rgba(255,255,255,0.10)' : 'rgba(239,68,68,0.20)'),
        opacity: cameraState === 'activating' ? 0.5 : 1,
        cursor:  cameraState === 'activating' ? 'wait' : 'pointer',
      }}
      onMouseEnter={(e) => { if (cameraState !== 'activating') e.currentTarget.style.opacity = '0.72' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = cameraState === 'activating' ? '0.5' : '1' }}
    >
      {isCameraEnabled
        ? <Video    size={size} strokeWidth={1.75} color="rgba(255,255,255,0.85)" />
        : <VideoOff size={size} strokeWidth={1.75} color="#ef4444" />
      }
    </button>
  )

  const ScreenBtn = ({ size = 14 }: { size?: number }) => (
    <button
      onClick={() => setScreenShareEnabled(!isScreenSharing).catch(console.warn)}
      title={isScreenSharing ? 'Dejar de compartir' : 'Compartir pantalla'}
      disabled={screenShareState === 'starting'}
      style={{
        ...controlBtn(isScreenSharing ? 'rgba(99,102,241,0.30)' : 'rgba(255,255,255,0.10)'),
        opacity: screenShareState === 'starting' ? 0.5 : 1,
        cursor:  screenShareState === 'starting' ? 'wait' : 'pointer',
      }}
      onMouseEnter={(e) => { if (screenShareState !== 'starting') e.currentTarget.style.opacity = '0.72' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = screenShareState === 'starting' ? '0.5' : '1' }}
    >
      {isScreenSharing
        ? <MonitorOff size={size} strokeWidth={1.75} color="#a5b4fc" />
        : <MonitorUp  size={size} strokeWidth={1.75} color="rgba(255,255,255,0.85)" />
      }
    </button>
  )

  const EndBtn = ({ size = 14 }: { size?: number }) => (
    <button
      onClick={() => endCall()}
      title="Finalizar llamada"
      style={controlBtn('rgba(239,68,68,0.20)')}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.42)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.20)' }}
    >
      <PhoneOff size={size} strokeWidth={1.75} color="#ef4444" />
    </button>
  )

  // =========================================================================
  // ── 🖥️ FULLSCREEN OVERLAY ────────────────────────────────────────────────
  // =========================================================================

  if (isFullscreen) {
    return (
      <div
        style={{
          position:   'fixed',
          inset:      0,
          zIndex:     9999,
          background: '#000',
          display:    'flex',
          flexDirection: 'column',
          overflow:   'hidden',
        }}
      >
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '10px 16px',
          background:     'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)',
          position:       'absolute',
          top:            0,
          left:           0,
          right:          0,
          zIndex:         10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Red live dot */}
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 6px rgba(239,68,68,0.8)',
              animation: 'callActiveDot 1.8s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: 'rgba(255,255,255,0.90)',
              letterSpacing: '0.01em',
            }}>
              {name}
            </span>
            {statusLabel && (
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: 'rgba(255,255,255,0.45)',
              }}>
                · {statusLabel}
              </span>
            )}
          </div>

          {/* Exit fullscreen */}
          <button
            onClick={() => setIsFullscreen(false)}
            title="Salir de pantalla completa"
            style={{
              ...darkIconBtn,
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(255,255,255,0.12)',
            }}
          >
            <X size={14} strokeWidth={2} color="rgba(255,255,255,0.85)" />
          </button>
        </div>

        {/* ── Main video area ───────────────────────────────────────────────── */}
        <div style={{ position: 'relative', flex: 1 }}>
          {/* Screen share or camera main display */}
          <video
            ref={mainVideoRef}
            autoPlay
            playsInline
            muted={mainIs === 'localScreen'}
            style={{
              width: '100%', height: '100%',
              objectFit: mainIs === 'peerScreen' || mainIs === 'localScreen'
                ? 'contain'
                : 'cover',
              display: 'block',
              background: '#000',
            }}
          />

          {/* Screen share label */}
          {(mainIs === 'localScreen' || mainIs === 'peerScreen') && (
            <div style={{
              position: 'absolute', top: 52, left: 16,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px 4px 8px',
              borderRadius: 20,
              background: 'rgba(0,0,0,0.60)',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#ef4444',
                animation: 'callActiveDot 1.6s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', letterSpacing: '0.02em' }}>
                {mainIs === 'localScreen'
                  ? 'TÚ · COMPARTIENDO'
                  : `${name.split(' ')[0].toUpperCase()} · COMPARTIENDO`}
              </span>
            </div>
          )}

          {/* ── Floating camera bubbles (bottom-right) ────────────────────── */}
          <div style={{
            position: 'absolute',
            bottom:   88,  // above the controls bar
            right:    16,
            display:  'flex',
            flexDirection: 'column',
            gap:      10,
          }}>
            {/* Peer camera */}
            {peerHasVideo && (
              <div style={fsCamBubble}>
                <video
                  ref={pipVideoRef}
                  autoPlay playsInline muted={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <span style={fsCamLabel}>{name.split(' ')[0]}</span>
              </div>
            )}

            {/* Local camera */}
            {isCameraEnabled && (
              <div style={fsCamBubble}>
                {cameraState === 'activating' ? (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[0, 0.2, 0.4].map((d) => (
                        <div key={d} style={{
                          width: 4, height: 4, borderRadius: '50%',
                          background: 'rgba(255,255,255,0.5)',
                          animation: `typingDot 1.1s ease-in-out ${d}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay playsInline muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }}
                  />
                )}
                <span style={fsCamLabel}>Tú</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Fullscreen controls bar ───────────────────────────────────────── */}
        <div style={{
          position:       'absolute',
          bottom:         0,
          left:           0,
          right:          0,
          height:         72,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            10,
          background:     'linear-gradient(to top, rgba(0,0,0,0.80) 0%, transparent 100%)',
          padding:        '0 24px',
        }}>
          <MicBtn    size={16} />
          <CamBtn    size={16} />
          <ScreenBtn size={16} />

          {/* Status */}
          <div style={{ flex: 1, maxWidth: 240, textAlign: 'center' }}>
            {screenShareState === 'starting' && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 500 }}>
                Abriendo selector…
              </span>
            )}
            {isScreenSharing && screenShareState === 'on' && (
              <span style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600, letterSpacing: '0.02em' }}>
                🖥️ COMPARTIENDO
              </span>
            )}
          </div>

          <EndBtn size={16} />
        </div>
      </div>
    )
  }

  // =========================================================================
  // ── PILL (minimized) ──────────────────────────────────────────────────────
  // =========================================================================

  const windowStyle: CSSProperties = {
    position:      'absolute',
    bottom:        80,
    right:         16,
    zIndex:        55,
    transform:     `translate(${drag.dx}px, ${drag.dy}px)`,
    pointerEvents: 'auto',
    userSelect:    'none',
  }

  if (isMinimized) {
    return (
      <div style={{
        ...windowStyle,
        display:      'flex',
        alignItems:   'center',
        gap:          8,
        height:       40,
        padding:      '0 10px 0 8px',
        borderRadius: 20,
        background:   '#111',
        border:       '1px solid rgba(255,255,255,0.12)',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.50)',
        animation:    'videoWindowIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#ef4444',
          boxShadow: '0 0 6px rgba(239,68,68,0.8)',
          animation: 'callActiveDot 1.6s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
          {peerHasScreenShare ? '🖥️' : isScreenSharing ? '🖥️' : '🎥'} {name.split(' ')[0]}
        </span>
        {/* Expand to fullscreen (if screen share available) */}
        {canFullscreen && (
          <button
            onClick={() => { setIsMinimized(false); setIsFullscreen(true) }}
            title="Pantalla completa"
            style={darkIconBtn}
          >
            <Expand size={11} strokeWidth={2} color="rgba(255,255,255,0.7)" />
          </button>
        )}
        <button
          onClick={() => setIsMinimized(false)}
          title="Expandir"
          style={darkIconBtn}
        >
          <Maximize2 size={11} strokeWidth={2} color="rgba(255,255,255,0.7)" />
        </button>
        <button
          onClick={() => endCall()}
          title="Finalizar"
          style={{ ...darkIconBtn, background: 'rgba(239,68,68,0.25)' }}
        >
          <PhoneOff size={11} strokeWidth={2} color="#ef4444" />
        </button>
      </div>
    )
  }

  // =========================================================================
  // ── MINI WINDOW (expanded) ────────────────────────────────────────────────
  // =========================================================================

  return (
    <div
      style={{
        ...windowStyle,
        width:        340,
        borderRadius: 16,
        background:   '#111',
        border:       '1px solid rgba(255,255,255,0.10)',
        boxShadow:    '0 24px 64px rgba(0,0,0,0.65), 0 4px 16px rgba(0,0,0,0.35)',
        overflow:     'hidden',
        animation:    'videoWindowIn 0.34s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}
    >
      {/* ── Header drag handle ───────────────────────────────────────────── */}
      <div
        onMouseDown={handleDragStart}
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '9px 10px 9px 12px',
          background:     'rgba(255,255,255,0.05)',
          cursor:         'grab',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <GripHorizontal size={13} strokeWidth={1.5} color="rgba(255,255,255,0.35)" />
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 5px rgba(239,68,68,0.75)',
            animation: 'callActiveDot 1.8s ease-in-out infinite',
          }} />
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: 'rgba(255,255,255,0.70)',
            letterSpacing: '0.02em',
          }}>
            {name}
          </span>
          {statusLabel && (
            <span style={{
              fontSize: 9, fontWeight: 500,
              color: 'rgba(255,255,255,0.40)',
              letterSpacing: '0.02em',
              marginLeft: 2,
            }}>
              · {statusLabel}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Fullscreen button — solo cuando hay screen share */}
          {canFullscreen && (
            <button
              onClick={() => setIsFullscreen(true)}
              title="Pantalla completa"
              onMouseDown={(e) => e.stopPropagation()}
              style={darkIconBtn}
            >
              <Expand size={11} strokeWidth={2} color="rgba(255,255,255,0.55)" />
            </button>
          )}
          <button
            onClick={() => setIsMinimized(true)}
            title="Minimizar"
            onMouseDown={(e) => e.stopPropagation()}
            style={darkIconBtn}
          >
            <Minimize2 size={11} strokeWidth={2} color="rgba(255,255,255,0.55)" />
          </button>
        </div>
      </div>

      {/* ── Video area ───────────────────────────────────────────────────── */}
      <div style={{
        position:   'relative',
        width:      340,
        height:     videoAreaH,
        background: '#000',
        transition: 'height 0.3s ease',
      }}>

        {/* Main display */}
        {mainIs === 'avatar' ? (
          <AvatarPlaceholder name={name} color={color} avatarUrl={peerAvatarUrl} />
        ) : (
          <video
            ref={mainVideoRef}
            autoPlay
            playsInline
            muted={mainIs === 'localScreen'}
            style={{
              width: '100%', height: '100%',
              objectFit: mainIs === 'peerScreen' || mainIs === 'localScreen'
                ? 'contain'
                : 'cover',
              display: 'block',
              background: '#000',
            }}
          />
        )}

        {/* Screen share label */}
        {(mainIs === 'localScreen' || mainIs === 'peerScreen') && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 8px 3px 6px',
            borderRadius: 20,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#ef4444',
              animation: 'callActiveDot 1.6s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 9, fontWeight: 600, color: '#fff', letterSpacing: '0.02em' }}>
              {mainIs === 'localScreen' ? 'TÚ · COMPARTIENDO' : `${name.split(' ')[0].toUpperCase()} · COMPARTIENDO`}
            </span>
          </div>
        )}

        {/* PiP — camera cuando el main es screen share */}
        {showPip && pipIs !== 'none' && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            width: 88, height: 66,
            borderRadius: 8,
            overflow: 'hidden',
            background: '#1a1a1a',
            border: '1.5px solid rgba(255,255,255,0.18)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}>
            <video
              ref={pipVideoRef}
              autoPlay playsInline muted
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
                transform: pipIs === 'localCamera' ? 'scaleX(-1)' : 'none',
              }}
            />
          </div>
        )}

        {/* Local camera PiP — cuando el main es la cámara del peer */}
        {!showPip && isCameraEnabled && mainIs === 'peerCamera' && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            width: 88, height: 66,
            borderRadius: 8,
            overflow: 'hidden',
            background: '#1a1a1a',
            border: '1.5px solid rgba(255,255,255,0.18)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}>
            {cameraState === 'activating' ? (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[0, 0.2, 0.4].map((d) => (
                    <div key={d} style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.5)',
                      animation: `typingDot 1.1s ease-in-out ${d}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay playsInline muted
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', display: 'block',
                  transform: 'scaleX(-1)',
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        6,
        padding:    '10px 12px',
        background: 'rgba(255,255,255,0.04)',
        borderTop:  '1px solid rgba(255,255,255,0.07)',
      }}>
        <MicBtn />
        <CamBtn />
        <ScreenBtn />

        {/* Status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {screenShareState === 'starting' && (
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)', fontWeight: 500 }}>
              Abriendo selector…
            </span>
          )}
          {isScreenSharing && screenShareState === 'on' && (
            <span style={{ fontSize: 9, color: '#a5b4fc', fontWeight: 600, letterSpacing: '0.02em' }}>
              🖥️ COMPARTIENDO
            </span>
          )}
        </div>

        <EndBtn />
      </div>
    </div>
  )
}

// ─── Avatar placeholder ────────────────────────────────────────────────────────

function AvatarPlaceholder({
  name,
  color,
  avatarUrl,
}: {
  name:      string
  color:     { body: string; dark: string }
  avatarUrl: string | null
}) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 10,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: `linear-gradient(145deg, ${color.body}, ${color.dark})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: `0 0 0 3px ${color.body}30`,
      }}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 500 }}>
        Cámara desactivada
      </span>
    </div>
  )
}

// ─── Fullscreen camera bubble styles ──────────────────────────────────────────

const fsCamBubble: CSSProperties = {
  position:     'relative',
  width:        112,
  height:       84,
  borderRadius: 10,
  overflow:     'hidden',
  background:   '#1a1a1a',
  border:       '1.5px solid rgba(255,255,255,0.18)',
  boxShadow:    '0 8px 24px rgba(0,0,0,0.60)',
  flexShrink:   0,
}

const fsCamLabel: CSSProperties = {
  position:   'absolute',
  bottom:     5,
  left:       7,
  fontSize:   9,
  fontWeight: 600,
  color:      'rgba(255,255,255,0.80)',
  letterSpacing: '0.04em',
  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
  textTransform: 'uppercase',
  pointerEvents: 'none',
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const darkIconBtn: CSSProperties = {
  width:          26,
  height:         26,
  borderRadius:   7,
  border:         'none',
  background:     'rgba(255,255,255,0.08)',
  cursor:         'pointer',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  flexShrink:     0,
  padding:        0,
  transition:     'background 0.12s',
}

function controlBtn(bg: string): CSSProperties {
  return {
    width:          34,
    height:         34,
    borderRadius:   9,
    border:         'none',
    background:     bg,
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    padding:        0,
    transition:     'all 0.12s',
  }
}
