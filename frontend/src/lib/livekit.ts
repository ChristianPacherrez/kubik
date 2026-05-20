// lib/livekit.ts — LiveKit Room singleton
//
// Patrón igual que _peerPositions en realtime.store:
//   módulo-level singleton, accesible sin pasar props ni usar Context.
//
// Responsabilidades:
//   · Crear/conectar la Room de LiveKit
//   · Adjuntar tracks de audio de peers remotos con <audio> hidden
//   · Sincronizar RoomEvents → voice.store (sin React)
//   · Redirigir RoomEvent.DataReceived → interaction-events dispatcher
//   · Exponer gainForZone() para useSpatialAudio
//   · Exponer toggleMute() para VoiceBar
//
// Diseñado para Fase C (video): añadir setCameraEnabled + video track handlers

import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  Track,
  RemoteAudioTrack,
  RemoteVideoTrack,
  LocalVideoTrack,
  Participant,
} from 'livekit-client'
import { useVoiceStore } from '@/store/voice.store'
import { parseInteractionPayload, dispatchInteractionEvent } from './interaction-events'

// ─── Singleton ────────────────────────────────────────────────────────────────

let _room: Room | null = null

export function getLiveKitRoom(): Room | null {
  return _room
}

// ─── Spatial gain config ──────────────────────────────────────────────────────
//
// Mapeamos las 3 zonas de proximidad a niveles de ganancia.
// Fuera de aura → 0.0 (silencio total — solo escuchas a quien tienes cerca).

export const SPATIAL_GAIN: Record<string, number> = {
  touch: 1.00,   // 55px   — conversación directa
  near:  0.70,   // 100px  — escucha cómoda
  aura:  0.30,   // 200px  — murmullo de fondo
}

export function gainForZone(zone: string | undefined): number {
  if (!zone) return 0.0
  return SPATIAL_GAIN[zone] ?? 0.0
}

// ─── Audio element registry ───────────────────────────────────────────────────

const _audioElements = new Map<string, HTMLAudioElement>()

function attachAudio(
  track:       RemoteAudioTrack,
  participant: RemoteParticipant,
): void {
  if (_audioElements.has(participant.identity)) return

  const el = track.attach() as HTMLAudioElement
  el.style.display = 'none'
  el.dataset.peerId = participant.identity
  document.body.appendChild(el)
  _audioElements.set(participant.identity, el)
}

function detachAudio(participantId: string): void {
  const el = _audioElements.get(participantId)
  if (!el) return
  el.pause()
  el.srcObject = null
  el.remove()
  _audioElements.delete(participantId)
}

function detachAllAudio(): void {
  _audioElements.forEach((el) => {
    el.pause()
    el.srcObject = null
    el.remove()
  })
  _audioElements.clear()
}

// ─── Room lifecycle ───────────────────────────────────────────────────────────

export async function createAndConnectRoom(
  url:      string,
  token:    string,
  roomName: string,
): Promise<Room> {
  // Disconnect previous session if any
  if (_room) {
    await _room.disconnect()
    _room = null
  }

  const room = new Room({
    audioCaptureDefaults: {
      echoCancellation:  true,
      noiseSuppression:  true,
      autoGainControl:   true,
    },
    adaptiveStream: true,
    dynacast:       true,
  })

  _room = room

  const store = useVoiceStore.getState  // shorthand (called as store().action)

  // ── Speaking detection ───────────────────────────────────────────────────────
  // ActiveSpeakersChanged fires with the full list of currently-speaking participants.
  // We diff against all known participants to update their speaking state.

  room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
    const speakingIds = new Set(speakers.map((p) => p.identity))
    const s = store()

    // Local player
    s.setSpeaking(speakingIds.has(room.localParticipant.identity))

    // Remote peers
    room.remoteParticipants.forEach((p) => {
      s.setPeerVoice(p.identity, { isSpeaking: speakingIds.has(p.identity) })
    })
  })

  // ── Track subscribed (audio, video o screen share de peer remoto) ───────────
  room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
    if (track.kind === Track.Kind.Audio) {
      const audioTrack = track as RemoteAudioTrack
      attachAudio(audioTrack, participant as RemoteParticipant)
      // Start silent — useSpatialAudio sets volume every 500ms based on proximity
      audioTrack.setVolume(0)
    } else if (track.kind === Track.Kind.Video) {
      if (pub.source === Track.Source.ScreenShare) {
        // Peer inició screen share
        store().setPeerVoice(participant.identity, { hasScreenShare: true })
      } else {
        // Peer activó cámara
        store().setPeerVoice(participant.identity, { hasVideo: true })
      }
    }
  })

  // ── Track unsubscribed ───────────────────────────────────────────────────────
  room.on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => {
    if (track.kind === Track.Kind.Audio) {
      detachAudio(participant.identity)
    } else if (track.kind === Track.Kind.Video) {
      if (pub.source === Track.Source.ScreenShare) {
        store().setPeerVoice(participant.identity, { hasScreenShare: false })
      } else {
        store().setPeerVoice(participant.identity, { hasVideo: false })
      }
    }
  })

  // ── Participant joined ───────────────────────────────────────────────────────
  room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
    store().setPeerVoice(participant.identity, {
      isConnected: true,
      isMuted:     !participant.isMicrophoneEnabled,
      isSpeaking:  false,
    })
  })

  // ── Participant left ─────────────────────────────────────────────────────────
  room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
    detachAudio(participant.identity)
    store().clearPeerVoice(participant.identity)
  })

  // ── Mic mute / unmute ────────────────────────────────────────────────────────
  room.on(RoomEvent.TrackMuted, (pub, participant) => {
    if (pub.kind === Track.Kind.Audio) {
      if (participant instanceof LocalParticipant) {
        store().setMuted(true)
      } else {
        store().setPeerVoice(participant.identity, { isMuted: true, isSpeaking: false })
      }
    } else if (pub.kind === Track.Kind.Video && !(participant instanceof LocalParticipant)) {
      if (pub.source === Track.Source.ScreenShare) {
        store().setPeerVoice(participant.identity, { hasScreenShare: false })
      } else {
        store().setPeerVoice(participant.identity, { hasVideo: false })
      }
    }
  })

  room.on(RoomEvent.TrackUnmuted, (pub, participant) => {
    if (pub.kind === Track.Kind.Audio) {
      if (participant instanceof LocalParticipant) {
        store().setMuted(false)
      } else {
        store().setPeerVoice(participant.identity, { isMuted: false })
      }
    } else if (pub.kind === Track.Kind.Video && !(participant instanceof LocalParticipant)) {
      if (pub.source === Track.Source.ScreenShare) {
        store().setPeerVoice(participant.identity, { hasScreenShare: true })
      } else {
        store().setPeerVoice(participant.identity, { hasVideo: true })
      }
    }
  })

  // ── Local track unpublished — el usuario detuvo el screen share desde el browser ──
  room.on(RoomEvent.LocalTrackUnpublished, (pub) => {
    if (pub.source === Track.Source.ScreenShare) {
      store().setScreenSharing(false)
      store().setScreenShareState('off')
    }
  })

  // ── Data received (interaction events: knock, message, call, typing) ─────────
  // Redirige el payload al dispatcher de interaction-events.ts.
  // Solo procesa paquetes que sean InteractionEvent válidos — ignora el resto.
  room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
    const event = parseInteractionPayload(payload)
    if (event) dispatchInteractionEvent(event)
  })

  // ── Disconnected ─────────────────────────────────────────────────────────────
  room.on(RoomEvent.Disconnected, () => {
    detachAllAudio()
    store().reset()
    _room = null
  })

  // ── Connect ───────────────────────────────────────────────────────────────────
  await room.connect(url, token)

  // Enable microphone
  await room.localParticipant.setMicrophoneEnabled(true)

  // Sync participants already in the room (joined before us)
  room.remoteParticipants.forEach((p) => {
    store().setPeerVoice(p.identity, {
      isConnected: true,
      isMuted:     !p.isMicrophoneEnabled,
      isSpeaking:  false,
    })
  })

  store().setConnected(true, roomName)

  return room
}

export async function disconnectRoom(): Promise<void> {
  if (_room) {
    await _room.disconnect()
    _room = null
  }
}

// ─── Controls ─────────────────────────────────────────────────────────────────

/** Toggle mic mute/unmute — called by VoiceBar and CallBubble */
export async function toggleMute(): Promise<void> {
  if (!_room) return
  const enabled = _room.localParticipant.isMicrophoneEnabled
  await _room.localParticipant.setMicrophoneEnabled(!enabled)
}

/**
 * Activar o desactivar la cámara local.
 * Actualiza voice.store.cameraState durante la transición.
 * Called by VideoCallWindow and CallBubble.
 */
export async function setCameraEnabled(enabled: boolean): Promise<void> {
  if (!_room) return
  const { setCameraEnabled: setEnabled, setCameraState } = useVoiceStore.getState()

  if (enabled) {
    setCameraState('activating')
    try {
      await _room.localParticipant.setCameraEnabled(true)
      setEnabled(true)
      setCameraState('on')
    } catch (err) {
      console.warn('[LiveKit] Camera enable failed:', err)
      setCameraState('error')
    }
  } else {
    await _room.localParticipant.setCameraEnabled(false)
    setEnabled(false)
    setCameraState('off')
  }
}

/**
 * Devuelve el track de video de la cámara local (si está publicado).
 * Usado por VideoCallWindow para adjuntar al elemento <video>.
 */
export function getLocalVideoTrack(): LocalVideoTrack | null {
  if (!_room) return null
  const pub = _room.localParticipant.getTrackPublication(Track.Source.Camera)
  return pub?.track ? (pub.track as LocalVideoTrack) : null
}

/**
 * Devuelve el track de video de un peer remoto (si está suscrito).
 * Usado por VideoCallWindow para adjuntar al elemento <video>.
 */
export function getPeerVideoTrack(peerId: string): RemoteVideoTrack | null {
  const participant = _room?.remoteParticipants.get(peerId)
  if (!participant) return null
  const pub = participant.getTrackPublication(Track.Source.Camera)
  return pub?.track ? (pub.track as RemoteVideoTrack) : null
}

// ─── Screen share controls ────────────────────────────────────────────────────

/**
 * Iniciar o detener compartir pantalla.
 * Si el usuario cancela el selector nativo del browser, el estado vuelve a 'off'.
 */
export async function setScreenShareEnabled(enabled: boolean): Promise<void> {
  if (!_room) return
  const { setScreenSharing, setScreenShareState } = useVoiceStore.getState()

  if (enabled) {
    setScreenShareState('starting')
    try {
      const pub = await _room.localParticipant.setScreenShareEnabled(true)
      if (pub) {
        // Track publicado correctamente
        setScreenSharing(true)
        setScreenShareState('on')
      } else {
        // El usuario canceló el selector nativo
        setScreenShareState('off')
      }
    } catch {
      // Cancelado o permiso denegado — silencioso (es flujo normal)
      setScreenShareState('off')
    }
  } else {
    await _room.localParticipant.setScreenShareEnabled(false)
    setScreenSharing(false)
    setScreenShareState('off')
  }
}

/**
 * Track de screen share local (Source.ScreenShare).
 * Disponible tras setCameraEnabled(true) con Source.ScreenShare.
 */
export function getLocalScreenTrack(): LocalVideoTrack | null {
  if (!_room) return null
  const pub = _room.localParticipant.getTrackPublication(Track.Source.ScreenShare)
  return pub?.track ? (pub.track as LocalVideoTrack) : null
}

/**
 * Track de screen share de un peer remoto.
 */
export function getPeerScreenTrack(peerId: string): RemoteVideoTrack | null {
  const participant = _room?.remoteParticipants.get(peerId)
  if (!participant) return null
  const pub = participant.getTrackPublication(Track.Source.ScreenShare)
  return pub?.track ? (pub.track as RemoteVideoTrack) : null
}
