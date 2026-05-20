'use client'

// useRealtimePresence — Presence + Movement + WorkMode + Reactions
//
// Responsabilidades:
//   1. Presencia: track/untrack del jugador local (join/leave)
//   2. Presencia: reconstruir lista de peers en cada sync (incluye workMode)
//   3. Presencia: linger de salida (900ms) para animación suave
//   4. Broadcast SEND: emitir posición del jugador a ~12fps
//   5. Broadcast RECV: enrutar posición de peers al event emitter (→ PeerAvatar DOM)
//   6. Presencia: re-track al cambiar de sala O de workMode
//   7. Broadcast RECV: recibir reacciones de peers → store
//   8. Broadcast SEND: registrar sender de reacciones (usado por ProximityPanel)
//
// Performance:
//   · Presence  → Zustand → React re-render (solo en join/leave/workMode-change)
//   · Broadcast move → emitPeerPosition() → rAF en PeerAvatar → DOM directo (0 re-renders)
//   · Reactions → Zustand → solo el PeerAvatar afectado re-renderiza

import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { usePlayerStore, Direction } from '@/store/player.store'
import { useOfficeStore } from '@/store/office.store'
import {
  useRealtimeStore,
  PeerPresence,
  emitPeerPosition,
  registerReactionSender,
} from '@/store/realtime.store'
import { useWorkModeStore } from '@/store/work-mode.store'
import { UserStatus } from '@/types'
import { WorkMode } from '@/lib/work-modes'

// ─── Constantes ───────────────────────────────────────────────────────────────

const CHANNEL             = 'office:main'
const BROADCAST_INTERVAL_MS = 80    // ~12.5fps — smooth movement, within free tier
const LEAVE_LINGER_MS     = 900     // matches peerLeave CSS animation duration
const MOVE_THRESHOLD      = 0.5    // px — avoids flood on idle

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TrackPayload {
  userId:    string
  name:      string
  avatarUrl: string | null
  status:    UserStatus
  workMode:  WorkMode
  zoneId:    string | null
  joinedAt:  number
}

interface MovePayload {
  userId:    string
  x:         number
  y:         number
  direction: Direction
  isMoving:  boolean
}

interface ReactionPayload {
  userId: string
  type:   string
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRealtimePresence(): void {
  const { user } = useUser()
  const channelRef        = useRef<RealtimeChannel | null>(null)
  const isTrackedRef      = useRef(false)
  const lingerTimers      = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const broadcastInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Efecto principal: connect / disconnect ───────────────────────────────────
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return

    const userId    = user.id
    const name      = user.fullName ?? user.username ?? 'Usuario'
    const avatarUrl = user.imageUrl ?? null

    const { setPeers, setConnected, setPeerLeaving, removePeer, setReaction } =
      useRealtimeStore.getState()

    // ── 1. Canal con Presence + Broadcast ───────────────────────────────────
    const channel = supabase.channel(CHANNEL, {
      config: {
        presence:  { key: userId },
        broadcast: { self: false, ack: false },
      },
    })
    channelRef.current = channel

    // ── 2. Presence sync → reconstruye peers (incluye workMode) ─────────────
    channel.on('presence', { event: 'sync' }, () => {
      const rawState     = channel.presenceState<TrackPayload>()
      const currentPeers = useRealtimeStore.getState().peers

      const incoming = new Map<string, PeerPresence>()
      for (const presences of Object.values(rawState)) {
        const p = presences[0] as TrackPayload | undefined
        if (!p || p.userId === userId) continue
        incoming.set(p.userId, {
          userId:    p.userId,
          name:      p.name      ?? 'Usuario',
          avatarUrl: p.avatarUrl ?? null,
          status:    p.status    ?? UserStatus.AVAILABLE,
          workMode:  p.workMode  ?? 'available',
          zoneId:    p.zoneId    ?? null,
          joinedAt:  p.joinedAt  ?? Date.now(),
          isLeaving: false,
        })
      }

      // Detect exits → linger animation
      for (const existingId of Object.keys(currentPeers)) {
        if (incoming.has(existingId)) continue
        if (currentPeers[existingId].isLeaving) continue

        setPeerLeaving(existingId)

        if (lingerTimers.current.has(existingId)) {
          clearTimeout(lingerTimers.current.get(existingId)!)
        }
        const timer = setTimeout(() => {
          removePeer(existingId)
          lingerTimers.current.delete(existingId)
        }, LEAVE_LINGER_MS)
        lingerTimers.current.set(existingId, timer)
      }

      // Merge: keep lingering peers + incoming snapshot
      const merged: Record<string, PeerPresence> = {}
      for (const [id, peer] of Object.entries(currentPeers)) {
        if (peer.isLeaving) merged[id] = peer
      }
      for (const [id, peer] of Array.from(incoming.entries())) {
        if (lingerTimers.current.has(id)) {
          clearTimeout(lingerTimers.current.get(id)!)
          lingerTimers.current.delete(id)
        }
        merged[id] = peer
      }

      setPeers(merged)
    })

    // ── 3. Broadcast RECV: posición → event emitter → PeerAvatar rAF ────────
    channel.on('broadcast', { event: 'move' }, ({ payload }: { payload: MovePayload }) => {
      const { userId: peerId, x, y, direction, isMoving } = payload
      if (peerId === userId) return
      emitPeerPosition(peerId, x, y, direction, isMoving)
    })

    // ── 4. Broadcast RECV: reacciones de peers ───────────────────────────────
    channel.on('broadcast', { event: 'reaction' }, ({ payload }: { payload: ReactionPayload }) => {
      const { userId: senderId, type } = payload
      if (senderId === userId) return
      setReaction(senderId, type)
    })

    // ── 5. Suscribir → track inicial → iniciar broadcast ────────────────────
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true)

        const player   = usePlayerStore.getState()
        const office   = useOfficeStore.getState()
        const workMode = useWorkModeStore.getState().mode

        await channel.track({
          userId,
          name,
          avatarUrl,
          status:   office.userStatus,
          workMode,
          zoneId:   player.currentZoneId,
          joinedAt: Date.now(),
        } satisfies TrackPayload)

        isTrackedRef.current = true

        // ── 6. Register reaction sender (used by ProximityPanel) ─────────
        registerReactionSender((type) => {
          channel.send({
            type:    'broadcast',
            event:   'reaction',
            payload: { userId, type } satisfies ReactionPayload,
          })
        })

        // ── 7. Broadcast SEND: posición del jugador a ~12fps ─────────────
        let prev = {
          x: player.x, y: player.y,
          direction: player.direction, isMoving: player.isMoving,
        }

        broadcastInterval.current = setInterval(() => {
          const p = usePlayerStore.getState()
          const moved        = Math.hypot(p.x - prev.x, p.y - prev.y) > MOVE_THRESHOLD
          const dirChanged   = p.direction !== prev.direction
          const stateChanged = p.isMoving  !== prev.isMoving

          if (!moved && !dirChanged && !stateChanged) return

          channel.send({
            type:    'broadcast',
            event:   'move',
            payload: { userId, x: p.x, y: p.y, direction: p.direction, isMoving: p.isMoving },
          })

          prev = { x: p.x, y: p.y, direction: p.direction, isMoving: p.isMoving }
        }, BROADCAST_INTERVAL_MS)

      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[kubik/presence] Canal en error:', status)
        setConnected(false)
      } else if (status === 'CLOSED') {
        setConnected(false)
      }
    })

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      if (broadcastInterval.current) {
        clearInterval(broadcastInterval.current)
        broadcastInterval.current = null
      }
      for (const timer of Array.from(lingerTimers.current.values())) clearTimeout(timer)
      lingerTimers.current.clear()
      registerReactionSender(() => {}) // clear sender

      channel.unsubscribe()
      channelRef.current   = null
      isTrackedRef.current = false

      setConnected(false)
      setPeers({})
    }
  }, [user])

  // ── Re-track cuando cambia zona, work mode O status ─────────────────────────
  //
  // Incluye userStatus en las deps para que cuando el usuario cambie su estado
  // (AVAILABLE → IN_MEETING → BUSY etc.) los demás peers vean el cambio
  // inmediatamente via Supabase Presence sync, sin esperar al heartbeat de 60s.

  const currentZoneId = usePlayerStore((s) => s.currentZoneId)
  const workMode      = useWorkModeStore((s) => s.mode)
  const userStatus    = useOfficeStore((s) => s.userStatus)

  useEffect(() => {
    const channel = channelRef.current
    if (!channel || !isTrackedRef.current || !user) return

    const player = usePlayerStore.getState()

    channel.track({
      userId:    user.id,
      name:      user.fullName ?? user.username ?? 'Usuario',
      avatarUrl: user.imageUrl ?? null,
      status:    userStatus,
      workMode,
      zoneId:    currentZoneId,
      joinedAt:  player.joinedAt ?? Date.now(),
    } as TrackPayload)
  }, [currentZoneId, workMode, userStatus, user])
}
