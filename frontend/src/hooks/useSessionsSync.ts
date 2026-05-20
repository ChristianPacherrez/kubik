'use client'

// useSessionsSync — suscripción global a sesiones de todas las salas
//
// Se llama UNA SOLA VEZ en InteractiveMap.
// Responsabilidades:
//   1. Fetch inicial de todas las sesiones activas y sus participantes
//   2. Suscripción Supabase Realtime (postgres_changes) en room_sessions
//   3. Suscripción Realtime en room_session_participants
//   4. Actualiza sessionsStore en cada cambio
//
// Resultado: todos los RoomNode y el MapSidebar leen del store y
// se re-renderizan automáticamente cuando cambia cualquier sesión.

import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useSessionsStore, RoomSession, SessionParticipant } from '@/store/sessions.store'

export function useSessionsSync(): void {
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const {
      setSession, removeSession,
      setParticipants, upsertParticipant, removeParticipant,
      clearAll,
    } = useSessionsStore.getState()

    // ── 1. Fetch inicial en paralelo ─────────────────────────────────────────
    Promise.all([
      supabase.from('room_sessions').select('*'),
      supabase.from('room_session_participants').select('*'),
    ]).then(([sessionsRes, participantsRes]) => {
      if (sessionsRes.data) {
        for (const s of sessionsRes.data as RoomSession[]) {
          setSession(s)
        }
      }
      if (participantsRes.data) {
        // Agrupar participantes por session_id
        const grouped: Record<string, SessionParticipant[]> = {}
        for (const p of participantsRes.data as SessionParticipant[]) {
          if (!grouped[p.session_id]) grouped[p.session_id] = []
          grouped[p.session_id].push(p)
        }
        for (const [sessionId, ps] of Object.entries(grouped)) {
          setParticipants(sessionId, ps)
        }
      }
    })

    // ── 2. Realtime subscriptions ────────────────────────────────────────────
    const channel = supabase
      .channel('kubik-sessions-global')

      // room_sessions: INSERT (sesión iniciada) / DELETE (sesión terminada)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_sessions' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            removeSession((payload.old as RoomSession).room_id)
          } else {
            setSession(payload.new as RoomSession)
          }
        }
      )

      // room_session_participants: INSERT (join) / DELETE (leave)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_session_participants' },
        (payload) => {
          const p = (payload.old ?? payload.new) as SessionParticipant
          if (payload.eventType === 'DELETE') {
            removeParticipant(p.session_id, p.user_id)
          } else {
            upsertParticipant(payload.new as SessionParticipant)
          }
        }
      )

      .subscribe()

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      channel.unsubscribe()
      clearAll()
    }
  }, [])
}
