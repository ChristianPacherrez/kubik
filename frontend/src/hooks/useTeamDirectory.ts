'use client'

// useTeamDirectory — directorio persistente de usuarios del workspace
//
// Combina tres fuentes de datos:
//   1. Supabase `profiles` table   → todos los usuarios registrados (persistente)
//   2. useRealtimeStore.peers      → peers online en este momento (Supabase Presence)
//   3. useUser() + userStatus      → el usuario actual (siempre online)
//
// La regla de merging:
//   · isOnline = (userId está en peers) O (userId === yo)
//   · status = peers[id].status si online, else profiles[id].status (last known)
//   · Si un peer está online pero NO en profiles (race condition al entrar):
//     se incluye igual, construido desde el peer data
//
// Fallback cuando Supabase no está configurado:
//   · Solo muestra el usuario actual + peers de Presence (sin directorio persistente)

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useRealtimeStore, PeerPresence } from '@/store/realtime.store'
import { useOfficeStore } from '@/store/office.store'
import { UserStatus } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeamMember {
  id:          string
  name:        string
  avatarUrl:   string | null
  email:       string | null
  status:      UserStatus
  isOnline:    boolean
  isMe:        boolean
  lastSeen:    string | null
  zoneId:      string | null
}

// ─── Sort order ───────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<string, number> = {
  AVAILABLE:  0,
  IN_MEETING: 1,
  BUSY:       2,
  AWAY:       3,
  OFFLINE:    5,
}

// ─── Row type from Supabase ───────────────────────────────────────────────────

interface ProfileRow {
  id:          string
  name:        string
  avatar_url:  string | null
  email:       string | null
  status:      string
  last_seen:   string | null
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTeamDirectory(): {
  members:   TeamMember[]
  isLoading: boolean
} {
  const { user: clerkUser }  = useUser()
  const peers      = useRealtimeStore((s) => s.peers)
  const userStatus = useOfficeStore((s) => s.userStatus)

  const [profiles,  setProfiles]  = useState<ProfileRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ── 1. Load all profiles ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false)
      return
    }

    const load = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, email, status, last_seen')
        .order('name')

      if (error) {
        // La tabla puede no existir todavía — degraded mode (solo peers online)
        console.warn('[kubik/team] profiles table not available:', error.message)
        setIsLoading(false)
        return
      }

      setProfiles((data ?? []) as ProfileRow[])
      setIsLoading(false)
    }

    load()

    // ── 2. Subscribe to table changes (new users joining) ─────────────────
    const channel = supabase
      .channel('team:profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = payload.old as { id?: string }
            setProfiles((prev) => prev.filter((p) => p.id !== old.id))
            return
          }

          const row = payload.new as ProfileRow
          setProfiles((prev) => {
            const idx = prev.findIndex((p) => p.id === row.id)
            if (idx >= 0) {
              const next = [...prev]
              next[idx] = row
              return next
            }
            return [...prev, row]
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── 3. Merge profiles + peers + current user ──────────────────────────────

  const myId = clerkUser?.id ?? ''

  const members: TeamMember[] = []
  const seenIds = new Set<string>()

  // ── 3a. Current user (always online, always first) ────────────────────
  if (clerkUser) {
    members.push({
      id:        myId,
      name:      clerkUser.fullName ?? clerkUser.username ?? 'Usuario',
      avatarUrl: clerkUser.imageUrl ?? null,
      email:     clerkUser.primaryEmailAddress?.emailAddress ?? null,
      status:    userStatus,
      isOnline:  true,
      isMe:      true,
      lastSeen:  null,
      zoneId:    null,
    })
    seenIds.add(myId)
  }

  // ── 3b. Profiles from DB + presence overlay ───────────────────────────
  for (const profile of profiles) {
    if (seenIds.has(profile.id)) continue          // skip current user
    seenIds.add(profile.id)

    const peer      = peers[profile.id]
    const isOnline  = Boolean(peer)

    members.push({
      id:        profile.id,
      name:      peer?.name       ?? profile.name,
      avatarUrl: peer?.avatarUrl  ?? profile.avatar_url,
      email:     profile.email,
      status:    isOnline
        ? (peer!.status ?? UserStatus.AVAILABLE)
        : ((profile.status as UserStatus) ?? UserStatus.OFFLINE),
      isOnline,
      isMe:      false,
      lastSeen:  profile.last_seen,
      zoneId:    peer?.zoneId ?? null,
    })
  }

  // ── 3c. Peers online but NOT yet in profiles (race — just joined) ─────
  for (const peer of Object.values(peers) as PeerPresence[]) {
    if (seenIds.has(peer.userId)) continue
    seenIds.add(peer.userId)

    members.push({
      id:        peer.userId,
      name:      peer.name,
      avatarUrl: peer.avatarUrl,
      email:     null,
      status:    peer.status ?? UserStatus.AVAILABLE,
      isOnline:  true,
      isMe:      false,
      lastSeen:  null,
      zoneId:    peer.zoneId,
    })
  }

  // ── 4. Sort: online first, then by status priority, then by name ──────
  const sorted = [...members].sort((a, b) => {
    // Current user pinned to top
    if (a.isMe) return -1
    if (b.isMe) return  1
    // Online before offline
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
    // By status within each group
    const sa = STATUS_ORDER[a.status] ?? 5
    const sb = STATUS_ORDER[b.status] ?? 5
    if (sa !== sb) return sa - sb
    // Alphabetical
    return a.name.localeCompare(b.name, 'es')
  })

  return { members: sorted, isLoading }
}
