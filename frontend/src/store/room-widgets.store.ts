// room-widgets.store.ts — estado de widgets de colaboración por sala
//
// Zustand para notas, tareas y links. Los datos vienen de Supabase DB
// y se mantienen sincronizados vía Realtime subscriptions.
//
// Patrón: optimistic updates → el UI se actualiza inmediatamente,
// Supabase confirma en background. Si falla, Realtime corrige.

import { create } from 'zustand'

// ─── Tipos de datos ───────────────────────────────────────────────────────────

export interface RoomNote {
  id:          string
  room_id:     string
  content:     string
  color:       NoteColor
  author_id:   string
  author_name: string
  created_at:  string
}

export interface RoomTask {
  id:          string
  room_id:     string
  text:        string
  done:        boolean
  author_id:   string
  author_name: string
  created_at:  string
}

export interface RoomLink {
  id:          string
  room_id:     string
  url:         string
  title:       string
  author_id:   string
  author_name: string
  created_at:  string
}

export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple'

export const NOTE_COLORS: Record<NoteColor, { bg: string; border: string; text: string }> = {
  yellow: { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-200'  },
  blue:   { bg: 'bg-sky-500/10',    border: 'border-sky-500/30',    text: 'text-sky-200'    },
  green:  { bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',text: 'text-emerald-200'},
  pink:   { bg: 'bg-rose-500/10',   border: 'border-rose-500/30',   text: 'text-rose-200'   },
  purple: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-200' },
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface RoomWidgetsState {
  // Datos por roomId
  notes:   Record<string, RoomNote[]>
  tasks:   Record<string, RoomTask[]>
  links:   Record<string, RoomLink[]>
  // Estado de carga inicial
  loading: Record<string, boolean>

  // ── Setters bulk (desde fetch inicial) ──────────────────────────────────
  setNotes:   (roomId: string, notes: RoomNote[]) => void
  setTasks:   (roomId: string, tasks: RoomTask[]) => void
  setLinks:   (roomId: string, links: RoomLink[]) => void
  setLoading: (roomId: string, v: boolean) => void

  // ── Notes ────────────────────────────────────────────────────────────────
  upsertNote: (note: RoomNote) => void
  removeNote: (id: string, roomId: string) => void

  // ── Tasks ────────────────────────────────────────────────────────────────
  upsertTask: (task: RoomTask) => void
  removeTask: (id: string, roomId: string) => void

  // ── Links ────────────────────────────────────────────────────────────────
  upsertLink: (link: RoomLink) => void
  removeLink: (id: string, roomId: string) => void
}

export const useRoomWidgetsStore = create<RoomWidgetsState>((set) => ({
  notes:   {},
  tasks:   {},
  links:   {},
  loading: {},

  // ── Bulk setters ─────────────────────────────────────────────────────────

  setNotes: (roomId, notes) =>
    set((s) => ({ notes: { ...s.notes, [roomId]: notes } })),

  setTasks: (roomId, tasks) =>
    set((s) => ({ tasks: { ...s.tasks, [roomId]: tasks } })),

  setLinks: (roomId, links) =>
    set((s) => ({ links: { ...s.links, [roomId]: links } })),

  setLoading: (roomId, v) =>
    set((s) => ({ loading: { ...s.loading, [roomId]: v } })),

  // ── Notes ────────────────────────────────────────────────────────────────

  upsertNote: (note) =>
    set((s) => {
      const existing = s.notes[note.room_id] ?? []
      const idx      = existing.findIndex((n) => n.id === note.id)
      const updated  = idx >= 0
        ? existing.map((n) => n.id === note.id ? note : n)
        : [note, ...existing]
      return { notes: { ...s.notes, [note.room_id]: updated } }
    }),

  removeNote: (id, roomId) =>
    set((s) => ({
      notes: {
        ...s.notes,
        [roomId]: (s.notes[roomId] ?? []).filter((n) => n.id !== id),
      },
    })),

  // ── Tasks ────────────────────────────────────────────────────────────────

  upsertTask: (task) =>
    set((s) => {
      const existing = s.tasks[task.room_id] ?? []
      const idx      = existing.findIndex((t) => t.id === task.id)
      const updated  = idx >= 0
        ? existing.map((t) => t.id === task.id ? task : t)
        : [...existing, task]
      return { tasks: { ...s.tasks, [task.room_id]: updated } }
    }),

  removeTask: (id, roomId) =>
    set((s) => ({
      tasks: {
        ...s.tasks,
        [roomId]: (s.tasks[roomId] ?? []).filter((t) => t.id !== id),
      },
    })),

  // ── Links ────────────────────────────────────────────────────────────────

  upsertLink: (link) =>
    set((s) => {
      const existing = s.links[link.room_id] ?? []
      const idx      = existing.findIndex((l) => l.id === link.id)
      const updated  = idx >= 0
        ? existing.map((l) => l.id === link.id ? link : l)
        : [link, ...existing]
      return { links: { ...s.links, [link.room_id]: updated } }
    }),

  removeLink: (id, roomId) =>
    set((s) => ({
      links: {
        ...s.links,
        [roomId]: (s.links[roomId] ?? []).filter((l) => l.id !== id),
      },
    })),
}))
