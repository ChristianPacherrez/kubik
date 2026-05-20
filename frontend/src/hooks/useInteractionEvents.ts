'use client'

// useInteractionEvents — escucha eventos de interacción social y los rutea
//
// Se monta UNA VEZ en OfficeCanvas. No re-renderiza — todas las acciones
// van a stores (Zustand getState) o funciones puras.
//
// Flujo:
//   LiveKit DataReceived → livekit.ts → dispatchInteractionEvent
//   → onInteractionEvent handlers (registrados aquí en useEffect)
//   → store actions + sound effects

import { useEffect } from 'react'
import { onInteractionEvent }  from '@/lib/interaction-events'
import { soundManager }        from '@/lib/ui-sounds'
import { useSpatialStore }     from '@/store/spatial.store'
import { useInteractionStore } from '@/store/interaction.store'
import { sendInteractionEvent } from '@/lib/interaction-events'
import { getLiveKitRoom }      from '@/lib/livekit'

export function useInteractionEvents() {
  useEffect(() => {
    // Capturar refs de store.getState para evitar closures sobre versiones stale
    const spatial     = useSpatialStore.getState
    const interaction = useInteractionStore.getState

    // ── knock ─────────────────────────────────────────────────────────────────
    const offKnock = onInteractionEvent('knock', (e) => {
      // 1. Mostrar KnockIndicator en el avatar del emisor
      spatial().sendKnock(e.fromId)

      // 2. Toast de notificación ("Ana quiere hablar contigo")
      interaction().addNotification({
        type:         'knock',
        fromId:       e.fromId,
        fromName:     e.fromName,
        fromAvatarUrl: e.fromAvatarUrl,
        ts:           Date.now(),
      })

      // 3. Sonido
      soundManager.playKnock()
    })

    // ── message ───────────────────────────────────────────────────────────────
    const offMessage = onInteractionEvent('message', (e) => {
      if (e.type !== 'message') return

      interaction().receiveMessage(e.fromId, e.fromName, e.text, e.messageId)

      // Sonido solo si el chat de ese peer no está abierto
      if (interaction().openChatId !== e.fromId) {
        soundManager.playMessageReceived()

        // Toast: "Mensaje de [name]"
        interaction().addNotification({
          type:         'knock',     // reutilizamos el estilo knock
          fromId:       e.fromId,
          fromName:     `💬 ${e.fromName}`,
          fromAvatarUrl: e.fromAvatarUrl,
          ts:           Date.now(),
        })
      }
    })

    // ── typing ────────────────────────────────────────────────────────────────
    const offTypingStart = onInteractionEvent('typing_start', (e) => {
      interaction().setTyping(e.fromId, true)
    })

    const offTypingStop = onInteractionEvent('typing_stop', (e) => {
      interaction().setTyping(e.fromId, false)
    })

    // ── call_request ──────────────────────────────────────────────────────────
    const offCallRequest = onInteractionEvent('call_request', (e) => {
      // No aceptar si ya estamos en llamada
      if (interaction().activeCallId || interaction().incomingCall) return

      interaction().setIncomingCall({
        fromId:       e.fromId,
        fromName:     e.fromName,
        fromAvatarUrl: e.fromAvatarUrl,
      })

      soundManager.startIncomingCall()
    })

    // ── call_accept ───────────────────────────────────────────────────────────
    const offCallAccept = onInteractionEvent('call_accept', (e) => {
      soundManager.stopIncomingCall()
      soundManager.playCallAccepted()

      // Caller side: marcar llamada activa con todos los metadatos del peer
      useInteractionStore.setState({
        activeCallId:            e.fromId,
        activeCallPeerName:      e.fromName,
        activeCallPeerAvatarUrl: e.fromAvatarUrl,
        callStartedAt:           Date.now(),
        isCallMinimized:         false,
      })

      // Elevar ganancia de audio de ese peer (override spatial)
      const room = getLiveKitRoom()
      if (room) {
        const participant = room.remoteParticipants.get(e.fromId)
        participant?.audioTrackPublications.forEach((pub) => {
          if (pub.audioTrack instanceof RemoteAudioTrack) {
            pub.audioTrack.setVolume(1.0)
          }
        })
      }
    })

    // ── call_decline ──────────────────────────────────────────────────────────
    const offCallDecline = onInteractionEvent('call_decline', (e) => {
      soundManager.stopIncomingCall()
      soundManager.playCallDeclined()

      // Toast de llamada rechazada
      interaction().addNotification({
        type:         'missed_call',
        fromId:       e.fromId,
        fromName:     e.fromName,
        fromAvatarUrl: e.fromAvatarUrl,
        ts:           Date.now(),
      })
    })

    // ── call_end ──────────────────────────────────────────────────────────────
    const offCallEnd = onInteractionEvent('call_end', () => {
      soundManager.stopIncomingCall()
      soundManager.playCallDeclined()    // sonido de finalización

      // Usar resetCall (no endCall) para evitar eco: endCall enviaría otro call_end
      useInteractionStore.getState().resetCall()
    })

    // Limpiar todos los handlers al desmontar
    return () => {
      offKnock()
      offMessage()
      offTypingStart()
      offTypingStop()
      offCallRequest()
      offCallAccept()
      offCallDecline()
      offCallEnd()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // Mount once — store refs son estables
}

// ─── Import needed for call_accept handler ────────────────────────────────────
// (necesario para setVolume en el peer que aceptó)
import { RemoteAudioTrack } from 'livekit-client'

// Re-export para simplificar imports en OfficeCanvas
export { sendInteractionEvent }
