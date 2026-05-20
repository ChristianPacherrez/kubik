'use client'

// useDMChat — mensajes DM persistentes via Supabase
//
// Fuente de verdad: tabla `messages` (Supabase, TEXT ids).
// dm_key = [userId1, userId2].sort().join(':')
//   → clave única por par, sin importar quién inicia el DM.
//
// Estrategia para crear el chat sin 409:
//   1. SELECT por dm_key → si existe, usar ese ID
//   2. Si no existe: UPSERT ignoreDuplicates (evita 409 en race conditions)
//   3. SELECT de nuevo para obtener el ID definitivo (sea nuevo o ya existía)
//   4. UPSERT chat_members (ignoreDuplicates) → idempotente, sin 409
//
// Mensajes:
//   - Carga historial al abrir (SELECT ORDER BY created_at ASC)
//   - Suscripción Realtime para mensajes nuevos (INSERT en este chat_id)
//   - Envío: insert optimista + INSERT a Supabase

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PersistedMessage {
  id:        string
  chatId:    string
  senderId:  string   // Clerk user ID ("user_xxxxx")
  text:      string
  createdAt: string   // ISO 8601
}

interface RawMessage {
  id:         string
  chat_id:    string
  sender_id:  string
  text:       string
  created_at: string
}

function toMsg(r: RawMessage): PersistedMessage {
  return {
    id:        r.id,
    chatId:    r.chat_id,
    senderId:  r.sender_id,
    text:      r.text,
    createdAt: r.created_at,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseDMChatReturn {
  chatId:      string | null
  messages:    PersistedMessage[]
  isLoading:   boolean
  isReady:     boolean          // chatId existe Y carga terminó → habilitar compositor
  sendMessage: (text: string) => Promise<void>
  error:       string | null
}

export function useDMChat(
  myId:   string | null,
  peerId: string | null,
): UseDMChatReturn {
  const [chatId,    setChatId]    = useState<string | null>(null)
  const [messages,  setMessages]  = useState<PersistedMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const chatIdRef = useRef<string | null>(null)
  chatIdRef.current = chatId

  // ── loadMessages — useCallback estable, reutilizable desde sendMessage ────
  const loadMessages = useCallback(async (cid: string) => {
    const { data, error: msgErr } = await supabase
      .from('messages')
      .select('id, chat_id, sender_id, text, created_at')
      .eq('chat_id', cid)
      .order('created_at', { ascending: true })
      .limit(200)

    if (msgErr) {
      console.error('[kubik/dm] loadMessages error:', msgErr.message, '| code:', msgErr.code)
      return
    }

    if (data) setMessages(data.map(toMsg))
  }, [])

  // ── 1. Obtener o crear el chat DM ─────────────────────────────────────────
  useEffect(() => {
    if (!myId || !peerId || !isSupabaseConfigured) {
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setMessages([])
    setChatId(null)
    setError(null)

    const dmKey = [myId, peerId].sort().join(':')

    const getOrCreateChat = async (): Promise<string | null> => {
      // Paso 1 — Buscar chat existente por dm_key
      const { data: existing, error: selectErr } = await supabase
        .from('chats')
        .select('id')
        .eq('dm_key', dmKey)
        .maybeSingle()

      if (selectErr) {
        console.error('[kubik/dm] SELECT chat error:', selectErr.message, selectErr.code)
        return null
      }
      if (existing?.id) return existing.id

      // Paso 2 — UPSERT (ignoreDuplicates evita 409 en race conditions)
      const { error: upsertErr } = await supabase
        .from('chats')
        .upsert(
          { id: crypto.randomUUID(), type: 'dm', dm_key: dmKey },
          { onConflict: 'dm_key', ignoreDuplicates: true },
        )

      if (upsertErr) {
        console.error('[kubik/dm] UPSERT chat error:', upsertErr.message, upsertErr.code)
        return null
      }

      // Paso 3 — Leer ID definitivo (el nuevo o el que ganó el race)
      const { data: final, error: finalErr } = await supabase
        .from('chats')
        .select('id')
        .eq('dm_key', dmKey)
        .single()

      if (finalErr || !final?.id) {
        console.error('[kubik/dm] SELECT final chat error:', finalErr?.message)
        return null
      }

      return final.id
    }

    const addMembers = async (cid: string) => {
      const { error: membersErr } = await supabase
        .from('chat_members')
        .upsert(
          [
            { chat_id: cid, user_id: myId },
            { chat_id: cid, user_id: peerId },
          ],
          { onConflict: 'chat_id,user_id', ignoreDuplicates: true },
        )
      if (membersErr) console.warn('[kubik/dm] addMembers warning:', membersErr.message)
    }

    // Pipeline: getOrCreate → addMembers → loadMessages
    ;(async () => {
      const cid = await getOrCreateChat()
      if (cancelled) return

      if (!cid) {
        setError('No se pudo crear o encontrar el chat.')
        setIsLoading(false)
        return
      }

      setChatId(cid)
      await addMembers(cid)
      if (!cancelled) await loadMessages(cid)
      if (!cancelled) setIsLoading(false)
    })().catch((err: unknown) => {
      if (!cancelled) {
        console.error('[kubik/dm] pipeline error:', err)
        setError('Error inesperado al cargar el chat.')
        setIsLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [myId, peerId, loadMessages])

  // ── 2. Suscripción Realtime — INSERT en messages para este chat ───────────
  useEffect(() => {
    if (!chatId || !isSupabaseConfigured) return

    const channelName = `dm:${chatId}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const msg = toMsg(payload.new as RawMessage)
          // Safety check client-side (por si el filtro server-side no aplica)
          if (msg.chatId !== chatId) return
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          )
        },
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn('[kubik/dm] realtime subscription error:', err)
        }
        if (status === 'CHANNEL_ERROR') {
          console.warn('[kubik/dm] realtime channel error for', channelName)
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [chatId])

  // ── 3. Enviar mensaje ─────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const cid     = chatIdRef.current
    const trimmed = text.trim()

    if (!cid || !myId || !trimmed) return

    const id  = crypto.randomUUID()
    const now = new Date().toISOString()

    // Optimista — aparece inmediatamente en UI sin esperar a Supabase
    setMessages((prev) => [...prev, { id, chatId: cid, senderId: myId, text: trimmed, createdAt: now }])

    const { error: insertErr } = await supabase
      .from('messages')
      .insert({ id, chat_id: cid, sender_id: myId, text: trimmed })

    if (insertErr) {
      console.error('[kubik/dm] INSERT error:', insertErr.message, '| code:', insertErr.code)
      setMessages((prev) => prev.filter((m) => m.id !== id))
      return
    }

    // Reload desde Supabase para garantizar consistencia con el servidor
    await loadMessages(cid)
  }, [myId, loadMessages])

  // isReady: true solo cuando chatId existe Y la carga de mensajes terminó
  const isReady = chatId !== null && !isLoading

  return { chatId, messages, isLoading, isReady, sendMessage, error }
}
