'use client'

// ChatPanel — mini DM flotante por peer
//
// Posición: bottom-right, justo encima de VoiceBar (bottom: 72px + margen).
// Glassmorphism consistente con el resto del sistema.
// Entrega de mensajes: interaction.store.sendMessage → LiveKit Data Channel.
// Typing indicator: debounce 600ms, eventos typing_start / typing_stop.

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import { X, Send } from 'lucide-react'
import { useInteractionStore } from '@/store/interaction.store'
import { sendInteractionEvent }  from '@/lib/interaction-events'
import { getBlobColor }          from '@/lib/visual-system'

// Cuánto tiempo de inactividad antes de enviar typing_stop
const TYPING_DEBOUNCE_MS = 600

export function ChatPanel() {
  const openChatId   = useInteractionStore((s) => s.openChatId)
  const openChatName = useInteractionStore((s) => s.openChatName)
  const closeChat    = useInteractionStore((s) => s.closeChat)
  const sendMessage  = useInteractionStore((s) => s.sendMessage)

  // thread actual — selector granular para evitar re-renders globales
  const thread = useInteractionStore((s) =>
    openChatId ? s.threads[openChatId] : undefined,
  )

  const [draft, setDraft]   = useState('')
  const bottomRef           = useRef<HTMLDivElement>(null)
  const inputRef            = useRef<HTMLTextAreaElement>(null)
  const typingTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef         = useRef(false)       // evitar envíos duplicados

  // Auto-scroll al recibir mensaje nuevo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread?.messages.length])

  // Focus input cuando se abre el chat
  useEffect(() => {
    if (openChatId) {
      setDraft('')
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [openChatId])

  // Limpiar timer de typing al desmontar / cerrar
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [])

  // ── Typing events ────────────────────────────────────────────────────────────

  const sendTypingStart = useCallback(() => {
    if (!openChatId || isTypingRef.current) return
    isTypingRef.current = true
    sendInteractionEvent({ type: 'typing_start' }, [openChatId]).catch(console.warn)
  }, [openChatId])

  const sendTypingStop = useCallback(() => {
    if (!openChatId || !isTypingRef.current) return
    isTypingRef.current = false
    sendInteractionEvent({ type: 'typing_stop' }, [openChatId]).catch(console.warn)
  }, [openChatId])

  const handleDraftChange = (val: string) => {
    setDraft(val)

    if (val.trim()) {
      sendTypingStart()
      // Reset debounce timer
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(sendTypingStop, TYPING_DEBOUNCE_MS)
    } else {
      sendTypingStop()
    }
  }

  // ── Send ─────────────────────────────────────────────────────────────────────

  const handleSend = () => {
    const text = draft.trim()
    if (!text) return
    // Cancelar typing antes de enviar
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    sendTypingStop()
    setDraft('')
    sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── No renderizar si está cerrado ────────────────────────────────────────────

  if (!openChatId || !openChatName) return null

  const color = getBlobColor(openChatId)
  const messages = thread?.messages ?? []
  const isTyping = thread?.isTyping ?? false

  return (
    <div
      style={{
        position:       'absolute',
        bottom:         80,          // 72px VoiceBar + 8px gap
        right:          16,
        width:          284,
        display:        'flex',
        flexDirection:  'column',
        borderRadius:   16,
        background:     'var(--color-bg-primary, #fff)',
        border:         '1px solid var(--color-border-secondary, rgba(0,0,0,0.09))',
        boxShadow:      '0 16px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)',
        backdropFilter: 'blur(24px)',
        overflow:       'hidden',
        zIndex:         50,
        animation:      'chatPanelIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards',
        pointerEvents:  'auto',
      }}
    >
      {/* Header */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        gap:            8,
        padding:        '10px 12px',
        borderBottom:   '1px solid var(--color-border-secondary, rgba(0,0,0,0.07))',
        background:     'var(--color-bg-secondary, rgba(248,250,252,0.8))',
      }}>
        {/* Avatar */}
        <div style={{
          width:          28,
          height:         28,
          borderRadius:   '50%',
          background:     `linear-gradient(135deg, ${color.body}, ${color.dark})`,
          flexShrink:     0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      `0 0 0 2px ${color.body}30`,
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>
            {openChatName.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Name */}
        <span style={{
          flex:         1,
          fontSize:     12,
          fontWeight:   700,
          color:        'var(--color-text-primary, #101828)',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {openChatName}
        </span>

        {/* Close */}
        <button
          onClick={closeChat}
          style={{
            flexShrink:     0,
            width:          24,
            height:         24,
            borderRadius:   6,
            border:         'none',
            background:     'transparent',
            cursor:         'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            color:          'var(--color-text-quaternary, #9CA3AF)',
          }}
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex:           1,
        overflowY:      'auto',
        padding:        '10px 10px 6px',
        display:        'flex',
        flexDirection:  'column',
        gap:            6,
        minHeight:      0,
        maxHeight:      280,
        // Custom scrollbar minimal
        scrollbarWidth: 'thin',
      }}>
        {messages.length === 0 && (
          <p style={{
            margin:    'auto',
            fontSize:  11,
            color:     'var(--color-text-quaternary, #9CA3AF)',
            textAlign: 'center',
            padding:   '24px 0',
          }}>
            Di hola 👋
          </p>
        )}

        {messages.map((msg) => {
          const isMe = msg.fromId === 'me'
          return (
            <div
              key={msg.id}
              style={{
                display:   'flex',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth:     '78%',
                padding:      '6px 10px',
                borderRadius: isMe ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                background:   isMe
                  ? `linear-gradient(135deg, ${color.body}, ${color.dark})`
                  : 'var(--color-bg-tertiary, rgba(0,0,0,0.05))',
                color:        isMe ? '#fff' : 'var(--color-text-primary, #101828)',
                fontSize:     12,
                lineHeight:   1.45,
                fontWeight:   isMe ? 500 : 400,
                wordBreak:    'break-word',
                boxShadow:    isMe
                  ? `0 2px 8px ${color.body}40`
                  : '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                {msg.text}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 2 }}>
            <div style={{
              width:          28,
              height:         20,
              borderRadius:   10,
              background:     'var(--color-bg-tertiary, rgba(0,0,0,0.06))',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            3,
              padding:        '0 8px',
            }}>
              {[0, 0.22, 0.44].map((delay) => (
                <div
                  key={delay}
                  style={{
                    width:        4,
                    height:       4,
                    borderRadius: '50%',
                    background:   color.body,
                    animation:    `typingDot 1.1s ease-in-out ${delay}s infinite`,
                    opacity:      0.8,
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 10, color: 'var(--color-text-quaternary, #9CA3AF)' }}>
              escribiendo…
            </span>
          </div>
        )}

        {/* Anchor for auto-scroll */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display:     'flex',
        alignItems:  'flex-end',
        gap:         6,
        padding:     '8px 10px',
        borderTop:   '1px solid var(--color-border-secondary, rgba(0,0,0,0.07))',
        background:  'var(--color-bg-secondary, rgba(248,250,252,0.8))',
      }}>
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje…"
          rows={1}
          style={{
            flex:       1,
            resize:     'none',
            border:     '1px solid var(--color-border-secondary, rgba(0,0,0,0.10))',
            borderRadius: 8,
            padding:    '6px 8px',
            fontSize:   12,
            lineHeight: 1.4,
            color:      'var(--color-text-primary, #101828)',
            background: 'var(--color-bg-primary, #fff)',
            outline:    'none',
            fontFamily: 'inherit',
            maxHeight:  72,
            overflowY:  'auto',
            scrollbarWidth: 'none',
          }}
        />

        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          style={{
            flexShrink:     0,
            width:          30,
            height:         30,
            borderRadius:   8,
            border:         'none',
            background:     draft.trim()
              ? `linear-gradient(135deg, ${color.body}, ${color.dark})`
              : 'var(--color-bg-tertiary, rgba(0,0,0,0.07))',
            color:          draft.trim() ? '#fff' : 'var(--color-text-quaternary, #9CA3AF)',
            cursor:         draft.trim() ? 'pointer' : 'default',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            transition:     'all 0.15s',
            boxShadow:      draft.trim() ? `0 2px 8px ${color.body}40` : 'none',
          }}
        >
          <Send size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
