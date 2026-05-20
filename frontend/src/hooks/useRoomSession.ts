'use client'

// useRoomSession — acciones de sesión para una sala específica
//
// Lee del sessionsStore (ya sincronizado por useSessionsSync).
// Provee: session, participants, isParticipant, isStarter
// + acciones: startSession / endSession / joinSession / leaveSession
//
// Optimistic updates: el store se actualiza antes de la respuesta de Supabase.
// Si Supabase falla, el Realtime sync corrige el estado.

import { useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useSessionsStore } from '@/store/sessions.store'

export function useRoomSession(roomId: string | null) {
  const { user } = useUser()

  // Leer estado del store (ya sincronizado globalmente)
  const session = useSessionsStore((s) =>
    roomId ? (s.sessions[roomId] ?? null) : null
  )
  const participants = useSessionsStore((s) =>
    session ? (s.participants[session.id] ?? []) : []
  )

  const isParticipant = participants.some((p) => p.user_id === user?.id)
  const isStarter     = session?.started_by === user?.id

  // ── Iniciar sesión ───────────────────────────────────────────────────────────
  const startSession = useCallback(async (title: string) => {
    if (!roomId || !user || !isSupabaseConfigured) return

    const { error } = await supabase
      .from('room_sessions')
      .upsert(
        {
          room_id:      roomId,
          title:        title.trim() || 'Sesión activa',
          started_by:   user.id,
          started_name: user.fullName ?? user.username ?? 'Usuario',
        },
        { onConflict: 'room_id' }  // Si ya hay sesión, la reemplaza
      )

    if (error) console.error('[session] start:', error.message)
  }, [roomId, user])

  // ── Terminar sesión (solo el creador) ────────────────────────────────────────
  const endSession = useCallback(async () => {
    if (!session || !isSupabaseConfigured) return

    // Eliminar participantes primero (CASCADE lo haría, pero es más rápido)
    await supabase
      .from('room_session_participants')
      .delete()
      .eq('session_id', session.id)

    const { error } = await supabase
      .from('room_sessions')
      .delete()
      .eq('id', session.id)

    if (error) console.error('[session] end:', error.message)
  }, [session])

  // ── Unirse a sesión ──────────────────────────────────────────────────────────
  const joinSession = useCallback(async () => {
    if (!session || !user || !isSupabaseConfigured) return

    const { error } = await supabase
      .from('room_session_participants')
      .upsert(
        {
          session_id: session.id,
          room_id:    session.room_id,
          user_id:    user.id,
          user_name:  user.fullName ?? user.username ?? 'Usuario',
          avatar_url: user.imageUrl ?? null,
        },
        { onConflict: 'session_id,user_id' }
      )

    if (error) console.error('[session] join:', error.message)
  }, [session, user])

  // ── Salir de sesión ──────────────────────────────────────────────────────────
  const leaveSession = useCallback(async () => {
    if (!session || !user || !isSupabaseConfigured) return

    const { error } = await supabase
      .from('room_session_participants')
      .delete()
      .eq('session_id', session.id)
      .eq('user_id', user.id)

    if (error) console.error('[session] leave:', error.message)
  }, [session, user])

  return {
    session,
    participants,
    isParticipant,
    isStarter,
    startSession,
    endSession,
    joinSession,
    leaveSession,
  }
}
