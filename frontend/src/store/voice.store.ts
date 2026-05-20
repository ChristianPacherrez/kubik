// voice.store.ts — estado de voz (LiveKit Spatial Audio Fase B)
//
// Dos capas:
//   · Estado local   — mic muted, isSpeaking, isConnected, audioLevel
//   · Estado de peers — peerVoice: Record<userId, PeerVoiceState>
//
// Actualizado por lib/livekit.ts vía RoomEvent listeners (no hooks).
// Consumido por VoiceBar, PeerAvatar, PlayerAvatar.
//
// Extensible para Fase C (video):
//   · Agregar hasVideo, isVideoEnabled, videoDeviceId, peerVideo

import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Estado de la cámara local */
export type CameraState = 'off' | 'activating' | 'on' | 'error'
/** Estado del screen share local */
export type ScreenShareState = 'off' | 'starting' | 'on' | 'error'

export interface PeerVoiceState {
  isSpeaking:      boolean
  isMuted:         boolean
  isConnected:     boolean
  /** Audio level 0–1 — reservado para future waveform indicator */
  audioLevel:      number
  /** Peer tiene cámara activa y el track de video está disponible */
  hasVideo:        boolean
  /** Peer está compartiendo pantalla */
  hasScreenShare:  boolean
}

interface VoiceStore {
  // ── Local player ──────────────────────────────────────────────────────────
  isMuted:          boolean
  isSpeaking:       boolean
  isConnected:      boolean
  roomName:         string | null
  audioLevel:       number
  /** Cámara local activa */
  isCameraEnabled:    boolean
  /** Fase del ciclo de vida de la cámara */
  cameraState:        CameraState
  /** Screen share local activo */
  isScreenSharing:    boolean
  /** Fase del ciclo de vida del screen share */
  screenShareState:   ScreenShareState

  // ── Remote peers ──────────────────────────────────────────────────────────
  peerVoice:   Record<string, PeerVoiceState>

  // ── Actions ───────────────────────────────────────────────────────────────
  setMuted:          (muted: boolean) => void
  setSpeaking:       (speaking: boolean) => void
  setAudioLevel:     (level: number) => void
  setConnected:      (connected: boolean, roomName?: string) => void
  setCameraEnabled:     (enabled: boolean) => void
  setCameraState:       (state: CameraState) => void
  setScreenSharing:     (sharing: boolean) => void
  setScreenShareState:  (state: ScreenShareState) => void
  setPeerVoice:         (userId: string, patch: Partial<PeerVoiceState>) => void
  clearPeerVoice:    (userId: string) => void
  /** Reset completo al desconectarse */
  reset:             () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useVoiceStore = create<VoiceStore>((set) => ({
  isMuted:            false,
  isSpeaking:         false,
  isConnected:        false,
  roomName:           null,
  audioLevel:         0,
  isCameraEnabled:    false,
  cameraState:        'off',
  isScreenSharing:    false,
  screenShareState:   'off',
  peerVoice:          {},

  setMuted:            (isMuted)    => set({ isMuted }),
  setSpeaking:         (isSpeaking) => set({ isSpeaking }),
  setAudioLevel:       (audioLevel) => set({ audioLevel }),
  setCameraEnabled:    (isCameraEnabled)  => set({ isCameraEnabled }),
  setCameraState:      (cameraState)      => set({ cameraState }),
  setScreenSharing:    (isScreenSharing)  => set({ isScreenSharing }),
  setScreenShareState: (screenShareState) => set({ screenShareState }),

  setConnected: (isConnected, roomName) =>
    set({ isConnected, roomName: roomName ?? null }),

  setPeerVoice: (userId, patch) =>
    set((s) => ({
      peerVoice: {
        ...s.peerVoice,
        [userId]: {
          // Base defaults — sobreescritos por estado existente y luego por el patch
          ...(s.peerVoice[userId] ?? {
            isSpeaking:     false,
            isMuted:        false,
            isConnected:    true,
            audioLevel:     0,
            hasVideo:       false,
            hasScreenShare: false,
          }),
          ...patch,
        },
      },
    })),

  clearPeerVoice: (userId) =>
    set((s) => {
      const next = { ...s.peerVoice }
      delete next[userId]
      return { peerVoice: next }
    }),

  reset: () =>
    set({
      isMuted:          false,
      isSpeaking:       false,
      isConnected:      false,
      roomName:         null,
      audioLevel:       0,
      isCameraEnabled:  false,
      cameraState:      'off',
      isScreenSharing:  false,
      screenShareState: 'off',
      peerVoice:        {},
    }),
}))
