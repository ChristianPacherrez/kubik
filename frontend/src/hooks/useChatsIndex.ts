'use client'

// useChatsIndex — índice de conversaciones DM del usuario actual
//
// Fuente de datos: tablas `chats`, `chat_members`, `messages` (Supabase).
//
// Responsabilidades:
//   1. Cargar todas las conversaciones DM donde el usuario es miembro
//   2. Obtener el último mensaje de cada conversación (preview)
//   3. Suscribirse a nuevos mensajes via Realtime (actualizar preview + unread)
//   4. Detectar nuevas membresías (nuevo DM iniciado) y recargar la lista
//   5. Actualizar interaction.store con unread count para que OnlineUsers muestre badge
//
// Lógica de unread:
//   - Cuando llega un mensaje nuevo (Realtime) y el chat no está abierto: +1 unread
//   - Cuando openChatId cambia a un peerId que coincide con un DM: reset unread a 0
//   - Al cerrar el DM (openChatId → null): recarga la lista (puede haber nuevos chats)

import { useCallback, useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useInteractionStore } from '@/store/interaction.store'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DMPreview {
  chatId:       string
  peerId:       string
  lastMessage:  string | null
  lastSenderId: string | null   // Clerk user ID del último emisor
  lastTs:       string | null   // ISO 8601
  unreadCount:  number          // session-only, reset en cero al abrir el chat
}

// ─── Sort helper ──────────────────────────────────────────────────────────────

function sortByLastTs(list: DMPreview[]): DMPreview[] {
  return [...list].sort((a, b) => {
    if (!a.lastTs && !b.lastTs) return 0
    if (!a.lastTs) return 1
    if (!b.lastTs) return -1
    return new Date(b.lastTs).getTime() - new Date(a.lastTs).getTime()
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChatsIndex(): {
  dms:       DMPreview[]
  isLoading: boolean
} {
  const { user }  = useUser()
  const myId      = user?.id ?? null

  const [dms,       setDms]       = useState<DMPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tick,      setTick]      = useState(0)    // incrementar para forzar recarga

  const openChatId     = useInteractionStore((s) => s.openChatId)
  const openChatIdRef  = useRef<string | null>(openChatId)   // siempre actualizado, sin recrear subscription
  const prevOpenChatId = useRef<string | null>(null)

  // Mantener el ref sincronizado sin afectar las subscriptions
  useEffect(() => {
    openChatIdRef.current = openChatId
  }, [openChatId])

  // ── Recargar cuando se cierra un DM (puede haber nuevos chats) ─────────────
  useEffect(() => {
    const prev = prevOpenChatId.current
    // Transición: DM abierto → cerrado
    if (prev !== null && openChatId === null) {
      setTick((t) => t + 1)
    }
    prevOpenChatId.current = openChatId
  }, [openChatId])

  // ── Reset unread cuando se abre un DM ─────────────────────────────────────
  useEffect(() => {
    if (!openChatId) return
    setDms((prev) =>
      prev.map((d) => d.peerId === openChatId ? { ...d, unreadCount: 0 } : d)
    )
  }, [openChatId])

  // ── Cargar lista de DMs ───────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!myId || !isSupabaseConfigured) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // 1. Todos los chats donde soy miembro
    const { data: memberships } = await supabase
      .from('chat_members')
      .select('chat_id')
      .eq('user_id', myId)

    const chatIds = (memberships ?? []).map((m) => m.chat_id)
    if (chatIds.length === 0) {
      setDms([])
      setIsLoading(false)
      return
    }

    // 2. Filtrar solo DMs (tienen dm_key)
    const { data: chats } = await supabase
      .from('chats')
      .select('id, dm_key')
      .in('id', chatIds)
      .eq('type', 'dm')
      .not('dm_key', 'is', null)

    const dmChats = chats ?? []
    if (dmChats.length === 0) {
      setDms([])
      setIsLoading(false)
      return
    }

    // 3. Último mensaje de cada chat (queries en paralelo)
    const lastMsgResults = await Promise.all(
      dmChats.map((c) =>
        supabase
          .from('messages')
          .select('sender_id, text, created_at')
          .eq('chat_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      )
    )

    // 4. Construir previews
    const previews: DMPreview[] = dmChats.map((c, i) => {
      // Extraer peerId del dm_key: "[id1]:[id2]" — uno de los dos soy yo
      const peerId   = (c.dm_key ?? '').split(':').find((id: string) => id !== myId) ?? ''
      const lastData = lastMsgResults[i]?.data ?? null
      return {
        chatId:       c.id,
        peerId,
        lastMessage:  lastData?.text ?? null,
        lastSenderId: lastData?.sender_id ?? null,
        lastTs:       lastData?.created_at ?? null,
        unreadCount:  0,
      }
    })

    setDms(sortByLastTs(previews))
    setIsLoading(false)
  }, [myId])

  useEffect(() => {
    load().catch(() => setIsLoading(false))
  }, [load, tick])

  // ── Realtime: mensajes nuevos → actualizar preview + unread ───────────────
  useEffect(() => {
    if (!myId || !isSupabaseConfigured) return

    const channel = supabase
      .channel('chats:index:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as {
            id: string; chat_id: string; sender_id: string; text: string; created_at: string
          }

          setDms((prev) => {
            const idx = prev.findIndex((d) => d.chatId === msg.chat_id)
            if (idx === -1) return prev   // chat no conocido aún (se recargará al cerrar DM)

            const current    = prev[idx]
            const isOpenChat = openChatIdRef.current === current.peerId
            const fromMe     = msg.sender_id === myId

            const updated: DMPreview = {
              ...current,
              lastMessage:  msg.text,
              lastSenderId: msg.sender_id,
              lastTs:       msg.created_at,
              unreadCount:  isOpenChat || fromMe
                ? 0
                : current.unreadCount + 1,
            }

            const next = [...prev]
            next[idx] = updated

            // Sincronizar badge en interaction.store (usado por OnlineUsers)
            if (!isOpenChat && !fromMe && updated.unreadCount > 0) {
              useInteractionStore.getState().setDMUnread(
                current.peerId,
                updated.unreadCount,
              )
            }

            return sortByLastTs(next)
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [myId])   // ← estable: openChatId se lee via ref, no como dep

  // ── Realtime: nueva membresía → soy añadido a un chat nuevo ──────────────
  useEffect(() => {
    if (!myId || !isSupabaseConfigured) return

    const channel = supabase
      .channel('chats:index:members')
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'chat_members',
          filter: `user_id=eq.${myId}`,
        },
        () => {
          // Recargar la lista al añadirme a un nuevo chat
          setTick((t) => t + 1)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [myId])

  return { dms, isLoading }
}
