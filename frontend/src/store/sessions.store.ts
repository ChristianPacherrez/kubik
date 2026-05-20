// sessions.store.ts — estado de sesiones activas por sala
//
// Una sesión = un espacio de trabajo compartido con título y participantes.
// Solo puede haber una sesión activa por sala al mismo tiempo (UNIQUE en DB).
//
// Actualizado desde dos fuentes:
//   · useSessionsSync (global): postgres_changes en room_sessions + room_session_participants
//   · useRoomSession (local): optimistic updates en CRUD
//
// Arquitectura de datos:
//   sessions[roomId]               → sesión activa de esa sala (o ausente)
//   participants[sessionId][]       → participantes de esa sesión

import { create } from 'zustand'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RoomSession {
  id:           string
  room_id:      string
  title:        string
  started_by:   string   // userId del creador
  started_name: string   // nombre para display (sin fetch extra)
  started_at:   string   // ISO
}

export interface SessionParticipant {
  session_id: string
  room_id:    string   // denormalizado para queries directas por sala
  user_id:    string
  user_name:  string
  avatar_url: string | null
  joined_at:  string   // ISO
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface SessionsState {
  /** Sesiones activas keyed by room_id */
  sessions:     Record<string, RoomSession>
  /** Participantes keyed by session_id */
  participants: Record<string, SessionParticipant[]>

  // ── Mutaciones atómicas (llamadas desde hooks) ───────────────────────────
  setSession:         (s: RoomSession) => void
  removeSession:      (roomId: string) => void
  setParticipants:    (sessionId: string, ps: SessionParticipant[]) => void
  upsertParticipant:  (p: SessionParticipant) => void
  removeParticipant:  (sessionId: string, userId: string) => void
  clearAll:           () => void
}

export const useSessionsStore = create<SessionsState>((set) => ({
  sessions:     {},
  participants: {},

  setSession: (s) =>
    set((state) => ({ sessions: { ...state.sessions, [s.room_id]: s } })),

  removeSession: (roomId) =>
    set((state) => {
      const next = { ...state.sessions }
      // Limpiar también los participantes de la sesión que se va
      const session = next[roomId]
      delete next[roomId]
      const nextP = { ...state.participants }
      if (session) delete nextP[session.id]
      return { sessions: next, participants: nextP }
    }),

  setParticipants: (sessionId, ps) =>
    set((state) => ({ participants: { ...state.participants, [sessionId]: ps } })),

  upsertParticipant: (p) =>
    set((state) => {
      const list = state.participants[p.session_id] ?? []
      const idx  = list.findIndex((x) => x.user_id === p.user_id)
      const next = idx >= 0
        ? list.map((x) => x.user_id === p.user_id ? p : x)
        : [...list, p]
      return { participants: { ...state.participants, [p.session_id]: next } }
    }),

  removeParticipant: (sessionId, userId) =>
    set((state) => ({
      participants: {
        ...state.participants,
        [sessionId]: (state.participants[sessionId] ?? []).filter((p) => p.user_id !== userId),
      },
    })),

  clearAll: () => set({ sessions: {}, participants: {} }),
}))
