'use client'

// useRoomWidgets — CRUD + Realtime sync de widgets de colaboración
//
// Responsabilidades:
//   1. Fetch inicial de notas/tareas/links del roomId activo
//   2. Suscripción Supabase Realtime (postgres_changes) para sync en vivo
//   3. Funciones de escritura (add, toggle, remove) con optimistic updates
//   4. Cleanup al cambiar de sala o desmontar
//
// Requiere tablas en Supabase:
//   · room_notes  (id, room_id, content, color, author_id, author_name, created_at)
//   · room_tasks  (id, room_id, text, done, author_id, author_name, created_at)
//   · room_links  (id, room_id, url, title, author_id, author_name, created_at)
//
// SQL de creación: /supabase/migrations/room_widgets.sql

import { useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  useRoomWidgetsStore,
  RoomNote, RoomTask, RoomLink, NoteColor,
} from '@/store/room-widgets.store'

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useRoomWidgets(roomId: string | null) {
  const { user } = useUser()
  const store    = useRoomWidgetsStore()

  // ── 1. Fetch + Realtime subscription ────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !isSupabaseConfigured) return

    store.setLoading(roomId, true)

    // Fetch inicial de los tres widgets en paralelo
    Promise.all([
      supabase.from('room_notes').select('*').eq('room_id', roomId).order('created_at', { ascending: false }),
      supabase.from('room_tasks').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
      supabase.from('room_links').select('*').eq('room_id', roomId).order('created_at', { ascending: false }),
    ]).then(([notesRes, tasksRes, linksRes]) => {
      if (notesRes.data) store.setNotes(roomId, notesRes.data as RoomNote[])
      if (tasksRes.data) store.setTasks(roomId, tasksRes.data as RoomTask[])
      if (linksRes.data) store.setLinks(roomId, linksRes.data as RoomLink[])
      store.setLoading(roomId, false)
    })

    // Supabase Realtime — postgres_changes por tabla filtrada al roomId
    const channel = supabase
      .channel(`room-widgets:${roomId}`)

      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_notes', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            store.removeNote(payload.old.id as string, roomId)
          } else {
            store.upsertNote(payload.new as RoomNote)
          }
        }
      )

      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_tasks', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            store.removeTask(payload.old.id as string, roomId)
          } else {
            store.upsertTask(payload.new as RoomTask)
          }
        }
      )

      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_links', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            store.removeLink(payload.old.id as string, roomId)
          } else {
            store.upsertLink(payload.new as RoomLink)
          }
        }
      )

      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  // ── 2. Acciones de escritura ─────────────────────────────────────────────────
  //
  // Patrón: optimistic update local → Supabase insert/update/delete en background.
  // Si la operación falla, Realtime no confirma el cambio → se corrige automáticamente.
  // Si Supabase no está configurado → solo update local (modo offline).

  const authorInfo = {
    author_id:   user?.id   ?? 'local',
    author_name: user?.fullName ?? user?.username ?? 'Tú',
  }

  const addNote = useCallback(async (content: string, color: NoteColor = 'yellow') => {
    if (!roomId) return
    const optimisticId = `optimistic-${Date.now()}`
    const note: RoomNote = {
      id:         optimisticId,
      room_id:    roomId,
      content,
      color,
      created_at: new Date().toISOString(),
      ...authorInfo,
    }
    store.upsertNote(note)

    if (!isSupabaseConfigured) return

    const { data, error } = await supabase
      .from('room_notes')
      .insert({ room_id: roomId, content, color, ...authorInfo })
      .select()
      .single()

    if (!error && data) {
      // Reemplazar el optimistic con el real (tiene el id de Supabase)
      store.removeNote(optimisticId, roomId)
      store.upsertNote(data as RoomNote)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user])

  const removeNote = useCallback(async (id: string) => {
    if (!roomId) return
    store.removeNote(id, roomId)
    if (isSupabaseConfigured) await supabase.from('room_notes').delete().eq('id', id)
  }, [roomId, store])

  const addTask = useCallback(async (text: string) => {
    if (!roomId) return
    const optimisticId = `optimistic-${Date.now()}`
    const task: RoomTask = {
      id:         optimisticId,
      room_id:    roomId,
      text,
      done:       false,
      created_at: new Date().toISOString(),
      ...authorInfo,
    }
    store.upsertTask(task)

    if (!isSupabaseConfigured) return

    const { data, error } = await supabase
      .from('room_tasks')
      .insert({ room_id: roomId, text, done: false, ...authorInfo })
      .select()
      .single()

    if (!error && data) {
      store.removeTask(optimisticId, roomId)
      store.upsertTask(data as RoomTask)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user])

  const toggleTask = useCallback(async (id: string, done: boolean) => {
    if (!roomId) return
    // Optimistic: actualizar en store
    const tasks = useRoomWidgetsStore.getState().tasks[roomId] ?? []
    const task  = tasks.find((t) => t.id === id)
    if (task) store.upsertTask({ ...task, done })
    if (isSupabaseConfigured) await supabase.from('room_tasks').update({ done }).eq('id', id)
  }, [roomId, store])

  const removeTask = useCallback(async (id: string) => {
    if (!roomId) return
    store.removeTask(id, roomId)
    if (isSupabaseConfigured) await supabase.from('room_tasks').delete().eq('id', id)
  }, [roomId, store])

  const addLink = useCallback(async (url: string, title: string) => {
    if (!roomId) return
    const optimisticId = `optimistic-${Date.now()}`
    const link: RoomLink = {
      id:         optimisticId,
      room_id:    roomId,
      url,
      title,
      created_at: new Date().toISOString(),
      ...authorInfo,
    }
    store.upsertLink(link)

    if (!isSupabaseConfigured) return

    const { data, error } = await supabase
      .from('room_links')
      .insert({ room_id: roomId, url, title, ...authorInfo })
      .select()
      .single()

    if (!error && data) {
      store.removeLink(optimisticId, roomId)
      store.upsertLink(data as RoomLink)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user])

  const removeLink = useCallback(async (id: string) => {
    if (!roomId) return
    store.removeLink(id, roomId)
    if (isSupabaseConfigured) await supabase.from('room_links').delete().eq('id', id)
  }, [roomId, store])

  // ── 3. Datos del roomId activo ───────────────────────────────────────────────
  const notes   = useRoomWidgetsStore((s) => s.notes[roomId ?? ''] ?? [])
  const tasks   = useRoomWidgetsStore((s) => s.tasks[roomId ?? ''] ?? [])
  const links   = useRoomWidgetsStore((s) => s.links[roomId ?? ''] ?? [])
  const loading = useRoomWidgetsStore((s) => s.loading[roomId ?? ''] ?? false)

  return {
    notes, tasks, links, loading,
    addNote, removeNote,
    addTask, toggleTask, removeTask,
    addLink, removeLink,
  }
}
