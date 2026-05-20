'use client'

// VoiceBar — control de voz flotante (Spatial Audio Fase B)
//
// Posición: esquina inferior derecha del mapa (screen-space, no transforma).
// Diseño: multiplayer-first — tipo Discord Huddle, no Zoom.
//
// Estados:
//   · LiveKit no configurado → pill gris "Audio desactivado"
//   · Conectando            → "Conectando..." con spinner de puntos
//   · Conectado + unmuted   → [🎤 verde] nombre-sala · N voces
//   · Conectado + muted     → [🔇 rojo] visualmente indicado
//   · Speaking              → ring pulsante verde alrededor del botón

import { useCallback } from 'react'
import { Mic, MicOff, Building2, MicOff as MicOffSmall } from 'lucide-react'
import { useVoiceStore }    from '@/store/voice.store'
import { useRealtimeStore } from '@/store/realtime.store'
import { toggleMute }       from '@/lib/livekit'
import { getBlobColor }     from '@/lib/visual-system'

const LK_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_LIVEKIT_URL)

// ─── Peer blob (pequeño indicador de peer en voz) ────────────────────────────

function PeerBlob({ userId, speaking, muted }: {
  userId:   string
  speaking: boolean
  muted:    boolean
}) {
  const peers = useRealtimeStore((s) => s.peers)
  const color = getBlobColor(userId)
  const name  = peers[userId]?.name ?? userId

  return (
    <div
      title={name}
      style={{
        width:        20,
        height:       20,
        borderRadius: '50%',
        background:   `linear-gradient(135deg, ${color.body}, ${color.dark})`,
        flexShrink:   0,
        position:     'relative',
        boxShadow:    speaking
          ? '0 0 0 2px #4ade80, 0 0 8px rgba(74,222,128,0.45)'
          : `0 0 0 1.5px ${color.body}40`,
        opacity:      muted ? 0.48 : 1,
        transition:   'box-shadow 0.2s, opacity 0.2s',
      }}
    >
      {muted && (
        <div
          aria-hidden
          style={{
            position:      'absolute',
            bottom:        -2,
            right:         -2,
            width:         11,
            height:        11,
            borderRadius:  '50%',
            background:    'rgba(239,68,68,0.90)',
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            border:        '1.5px solid var(--color-bg-primary, #fff)',
            pointerEvents: 'none',
          }}
        >
          <MicOffSmall size={6} strokeWidth={2.5} color="#fff" />
        </div>
      )}
    </div>
  )
}

// ─── VoiceBar ─────────────────────────────────────────────────────────────────

export function VoiceBar() {
  const isConnected = useVoiceStore((s) => s.isConnected)
  const isMuted     = useVoiceStore((s) => s.isMuted)
  const isSpeaking  = useVoiceStore((s) => s.isSpeaking)
  const peerVoice   = useVoiceStore((s) => s.peerVoice)

  const handleToggleMute = useCallback(() => {
    toggleMute().catch(console.warn)
  }, [])

  // Voice participants
  const voicePeers      = Object.entries(peerVoice).filter(([, v]) => v.isConnected)
  const voicePeerCount  = voicePeers.length
  const totalVoiceCount = voicePeerCount + (isConnected ? 1 : 0)
  const visiblePeers    = voicePeers.slice(0, 4)
  const extraCount      = voicePeerCount - visiblePeers.length

  // ── Not configured ────────────────────────────────────────────────────────
  if (!LK_CONFIGURED) {
    return (
      <div style={pillStyle}>
        <Mic size={14} strokeWidth={1.75} color="var(--color-text-quaternary, #9CA3AF)" />
        <span style={{
          fontSize: 10, fontWeight: 500,
          color: 'var(--color-text-quaternary, #9CA3AF)',
        }}>
          Audio desactivado
        </span>
      </div>
    )
  }

  // ── Main bar ──────────────────────────────────────────────────────────────
  return (
    <div style={pillStyle}>

      {/* Mic toggle button */}
      <button
        onClick={handleToggleMute}
        disabled={!isConnected}
        title={isMuted ? 'Activar micrófono (M)' : 'Silenciar micrófono (M)'}
        style={{
          position:       'relative',
          width:          30,
          height:         30,
          borderRadius:   8,
          border:         'none',
          background:     !isConnected
            ? 'rgba(0,0,0,0.06)'
            : isMuted
            ? 'rgba(239,68,68,0.12)'
            : 'rgba(74,222,128,0.10)',
          cursor:         isConnected ? 'pointer' : 'default',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       15,
          transition:     'all 0.15s',
          flexShrink:     0,
        }}
        onMouseEnter={(e) => {
          if (isConnected) {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.75'
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = '1'
        }}
      >
        {/* Speaking pulse ring — solo visible cuando habla y no está silenciado */}
        {isSpeaking && !isMuted && (
          <div
            aria-hidden
            style={{
              position:     'absolute',
              inset:        -3,
              borderRadius: 11,
              border:       '2px solid #4ade80',
              animation:    'voiceSpeakPulse 1.4s ease-in-out infinite',
              pointerEvents:'none',
            }}
          />
        )}

        {isMuted
          ? <MicOff size={14} strokeWidth={1.75} color="#ef4444" />
          : <Mic    size={14} strokeWidth={1.75} color={isConnected ? '#4ade80' : 'var(--color-text-quaternary, #9CA3AF)'} />
        }
      </button>

      {/* Room name + voice count */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{
          fontSize:   11,
          fontWeight: 600,
          color:      'var(--color-text-primary, #111)',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
          display:    'flex',
          alignItems: 'center',
          gap:        4,
        }}>
          {isConnected && <Building2 size={10} strokeWidth={1.75} color="var(--color-text-tertiary, #475467)" />}
          {isConnected ? 'Oficina' : 'Conectando…'}
        </span>

        <span style={{
          fontSize:   9,
          fontWeight: 500,
          color:      'var(--color-text-quaternary, #9CA3AF)',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}>
          {isConnected
            ? `${totalVoiceCount} ${totalVoiceCount === 1 ? 'voz' : 'voces'}`
            : 'iniciando audio…'}
        </span>
      </div>

      {/* Connected peer blobs */}
      {isConnected && voicePeerCount > 0 && (
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', marginLeft: 2 }}>
          {visiblePeers.map(([userId, state]) => (
            <PeerBlob
              key={userId}
              userId={userId}
              speaking={state.isSpeaking}
              muted={state.isMuted}
            />
          ))}
          {extraCount > 0 && (
            <span style={{
              fontSize: 9,
              color:    'var(--color-text-quaternary, #9CA3AF)',
              marginLeft: 1,
            }}>
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {/* Connection status dot */}
      <div
        aria-hidden
        style={{
          width:        7,
          height:       7,
          borderRadius: '50%',
          flexShrink:   0,
          background:   isConnected ? '#4ade80' : '#f59e0b',
          boxShadow:    isConnected
            ? '0 0 6px rgba(74,222,128,0.65)'
            : '0 0 4px rgba(245,158,11,0.5)',
          animation:    isConnected
            ? 'voiceConnectedGlow 3s ease-in-out infinite'
            : 'voiceConnectedGlow 1s ease-in-out infinite',
        }}
      />
    </div>
  )
}

// ─── Shared pill style ────────────────────────────────────────────────────────

const pillStyle: React.CSSProperties = {
  display:        'flex',
  alignItems:     'center',
  gap:            8,
  padding:        '7px 12px 7px 8px',
  borderRadius:   14,
  background:     'var(--color-bg-primary, #FFFFFF)',
  border:         '1px solid var(--color-border-secondary, rgba(0,0,0,0.09))',
  boxShadow:      '0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.07)',
  backdropFilter: 'blur(20px)',
  pointerEvents:  'auto',
  userSelect:     'none',
}
