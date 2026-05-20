// interaction.store.ts — Estado de interacciones sociales peer-to-peer
//
// Gestiona:
//   · DM Chat threads (mensajes, typing, unread) — uno activo a la vez
//   · Incoming call state
//   · Notification queue (knock toasts, missed calls)
//
// No persiste entre sesiones (Zustand en memoria).
// Extensible para localStorage/Supabase en Fase siguiente.

import { create } from 'zustand'
import { sendInteractionEvent } from '@/lib/interaction-events'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id:     string
  fromId: string   // userId del emisor ('me' = player local)
  text:   string
  ts:     number   // Date.now()
}

export interface ChatThread {
  peerId:     string
  peerName:   string
  messages:   ChatMessage[]
  isTyping:   boolean
  unreadCount: number
}

export interface IncomingCall {
  fromId:       string
  fromName:     string
  fromAvatarUrl: string | null
}

export interface SocialNotification {
  id:           string
  type:         'knock' | 'missed_call'
  fromId:       string
  fromName:     string
  fromAvatarUrl: string | null
  ts:           number
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface InteractionStore {
  // ── Chat ──────────────────────────────────────────────────────────────────
  /** Todos los threads abiertos (se mantienen aunque el panel esté cerrado) */
  threads:      Record<string, ChatThread>   // peerId → thread
  /** Peer con el panel de chat visible */
  openChatId:   string | null
  openChatName: string | null

  /** Abrir panel de chat con un peer */
  openChat:  (peerId: string, peerName: string) => void
  /** Cerrar panel */
  closeChat: () => void

  /**
   * Recibir mensaje de un peer remoto.
   * Si el chat está abierto con ese peer, no incrementa unreadCount.
   */
  receiveMessage: (fromId: string, fromName: string, text: string, messageId: string) => void

  /**
   * Enviar mensaje al peer actualmente abierto en el chat.
   * Añade al thread local + publica via LiveKit.
   */
  sendMessage: (text: string) => void

  /** Indicador de typing (recibido del peer remoto) */
  setTyping: (peerId: string, isTyping: boolean) => void

  /** Total de mensajes sin leer entre todos los threads */
  totalUnread: () => number

  /**
   * Actualizar el unread count de un DM desde fuentes externas
   * (useChatsIndex lo llama cuando llega un mensaje via Supabase Realtime).
   */
  setDMUnread: (peerId: string, count: number) => void

  // ── Calls ─────────────────────────────────────────────────────────────────
  incomingCall:  IncomingCall | null
  /** Peer con el que estamos en llamada activa (post-accept) */
  activeCallId:          string | null
  activeCallPeerName:    string | null
  activeCallPeerAvatarUrl: string | null
  /** Timestamp Date.now() cuando la llamada fue aceptada */
  callStartedAt:         number | null
  /** Burbuja minimizada a pill */
  isCallMinimized:       boolean

  setIncomingCall: (call: IncomingCall | null) => void
  acceptCall:      () => void
  declineCall:     () => void
  /** Envía call_end al peer y limpia el estado (iniciador local del cierre) */
  endCall:         () => void
  /** Sólo limpia el estado local — no envía call_end (usar al recibir call_end) */
  resetCall:       () => void
  minimizeCall:    (minimized: boolean) => void

  // ── Notifications ─────────────────────────────────────────────────────────
  /** Cola de toasts — se muestra el primero, el resto espera */
  notifications: SocialNotification[]

  addNotification:     (n: Omit<SocialNotification, 'id'>) => void
  dismissNotification: (id: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function ensureThread(
  threads: Record<string, ChatThread>,
  peerId:  string,
  peerName: string,
): ChatThread {
  return threads[peerId] ?? {
    peerId,
    peerName,
    messages:    [],
    isTyping:    false,
    unreadCount: 0,
  }
}

// ─── Store implementation ─────────────────────────────────────────────────────

export const useInteractionStore = create<InteractionStore>((set, get) => ({
  threads:      {},
  openChatId:   null,
  openChatName: null,

  // ── Chat ────────────────────────────────────────────────────────────────────

  openChat: (peerId, peerName) =>
    set((s) => ({
      openChatId:   peerId,
      openChatName: peerName,
      threads: {
        ...s.threads,
        [peerId]: {
          ...ensureThread(s.threads, peerId, peerName),
          unreadCount: 0,  // marcar como leído al abrir
        },
      },
    })),

  closeChat: () => set({ openChatId: null, openChatName: null }),

  receiveMessage: (fromId, fromName, text, messageId) =>
    set((s) => {
      const existing = ensureThread(s.threads, fromId, fromName)
      const isOpen   = s.openChatId === fromId
      return {
        threads: {
          ...s.threads,
          [fromId]: {
            ...existing,
            messages: [
              ...existing.messages,
              { id: messageId, fromId, text, ts: Date.now() },
            ],
            unreadCount: isOpen ? 0 : existing.unreadCount + 1,
          },
        },
      }
    }),

  sendMessage: (text) => {
    const { openChatId, openChatName } = get()
    if (!openChatId || !text.trim()) return

    const messageId = makeId()
    const msg: ChatMessage = {
      id:     messageId,
      fromId: 'me',
      text:   text.trim(),
      ts:     Date.now(),
    }

    // Añadir al thread local (optimistic — no espera confirmación del peer)
    set((s) => {
      const existing = ensureThread(s.threads, openChatId, openChatName ?? openChatId)
      return {
        threads: {
          ...s.threads,
          [openChatId]: {
            ...existing,
            messages: [...existing.messages, msg],
          },
        },
      }
    })

    // Publicar via LiveKit
    sendInteractionEvent(
      { type: 'message', text: text.trim(), messageId, timestamp: msg.ts },
      [openChatId],
    ).catch(console.warn)
  },

  setTyping: (peerId, isTyping) =>
    set((s) => {
      const existing = s.threads[peerId]
      if (!existing) return s
      return {
        threads: {
          ...s.threads,
          [peerId]: { ...existing, isTyping },
        },
      }
    }),

  totalUnread: () => {
    const { threads } = get()
    return Object.values(threads).reduce((acc, t) => acc + t.unreadCount, 0)
  },

  setDMUnread: (peerId, count) =>
    set((s) => {
      const existing = ensureThread(s.threads, peerId, peerId)
      return {
        threads: {
          ...s.threads,
          [peerId]: { ...existing, unreadCount: count },
        },
      }
    }),

  // ── Calls ───────────────────────────────────────────────────────────────────

  incomingCall:            null,
  activeCallId:            null,
  activeCallPeerName:      null,
  activeCallPeerAvatarUrl: null,
  callStartedAt:           null,
  isCallMinimized:         false,

  setIncomingCall: (call) => set({ incomingCall: call }),

  acceptCall: () => {
    const { incomingCall } = get()
    if (!incomingCall) return
    // Enviar confirmación al caller
    sendInteractionEvent({ type: 'call_accept' }, [incomingCall.fromId]).catch(console.warn)
    set({
      activeCallId:            incomingCall.fromId,
      activeCallPeerName:      incomingCall.fromName,
      activeCallPeerAvatarUrl: incomingCall.fromAvatarUrl,
      callStartedAt:           Date.now(),
      isCallMinimized:         false,
      incomingCall:            null,
    })
  },

  declineCall: () => {
    const { incomingCall } = get()
    if (!incomingCall) return
    sendInteractionEvent({ type: 'call_decline' }, [incomingCall.fromId]).catch(console.warn)
    set({ incomingCall: null })
  },

  endCall: () => {
    const { activeCallId } = get()
    if (activeCallId) {
      sendInteractionEvent({ type: 'call_end' }, [activeCallId]).catch(console.warn)
    }
    get().resetCall()
  },

  resetCall: () =>
    set({
      activeCallId:            null,
      activeCallPeerName:      null,
      activeCallPeerAvatarUrl: null,
      callStartedAt:           null,
      isCallMinimized:         false,
    }),

  minimizeCall: (minimized) => set({ isCallMinimized: minimized }),

  // ── Notifications ───────────────────────────────────────────────────────────

  notifications: [],

  addNotification: (n) =>
    set((s) => ({
      notifications: [
        ...s.notifications,
        { ...n, id: makeId() },
      ].slice(-6),  // máximo 6 en cola
    })),

  dismissNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),
}))
