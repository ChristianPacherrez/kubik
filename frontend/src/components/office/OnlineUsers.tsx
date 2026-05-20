'use client'

// OnlineUsers — pestaña "Equipo" del panel derecho
//
// Fuente de datos: useTeamDirectory()
//   · Todos los usuarios registrados (tabla Supabase `profiles`)
//   · Overlaid con presencia realtime (useRealtimeStore.peers via Supabase Presence)
//   · El usuario actual siempre aparece arriba como "Tú"
//
// Acciones:
//   Mensaje → openChat + switch a tab Chat
//   Llamar  → sendInteractionEvent({ type: 'call_request' }, [userId])
//
// Cuando Supabase no está configurado o la tabla profiles no existe:
//   Muestra solo el usuario actual + peers online (Presence-only fallback).

import { useState } from 'react'
import { Phone, MessageSquare, Wifi, WifiOff } from 'lucide-react'
import { useInteractionStore } from '@/store/interaction.store'
import { sendInteractionEvent } from '@/lib/interaction-events'
import { useTeamDirectory, TeamMember } from '@/hooks/useTeamDirectory'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Panel, PanelHeader, EmptySlate, STATUS_DOT, STATUS_LABEL } from '@/components/ui/kubik'
import { cn } from '@/lib/utils'
import { UserStatus } from '@/types'
import { Users } from 'lucide-react'

// ─── OnlineUsers ──────────────────────────────────────────────────────────────

interface OnlineUsersProps {
  onMessageUser?: (userId: string, userName: string) => void
}

export function OnlineUsers({ onMessageUser }: OnlineUsersProps) {
  const { members, isLoading } = useTeamDirectory()
  const threads = useInteractionStore((s) => s.threads)

  const handleMessage = (member: TeamMember) => {
    useInteractionStore.getState().openChat(member.id, member.name)
    onMessageUser?.(member.id, member.name)
  }

  const handleCall = (member: TeamMember) => {
    sendInteractionEvent({ type: 'call_request' }, [member.id]).catch(console.warn)
  }

  const onlineCount = members.filter((m) => m.isOnline).length
  const me          = members.find((m) => m.isMe)
  const others      = members.filter((m) => !m.isMe)
  const hasOnlineOthers  = others.some((m) => m.isOnline)
  const hasOfflineOthers = others.some((m) => !m.isOnline)

  // ── Header badge ─────────────────────────────────────────────────────────
  const onlineBadge = (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)]">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-60" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success-500" />
      </span>
      <span className="text-[10px] font-semibold text-[var(--color-text-primary)] tabular-nums">
        {onlineCount} online
      </span>
    </div>
  )

  return (
    <Panel side="left" className="w-[228px] flex-shrink-0">
      <PanelHeader
        title="Equipo"
        icon={<Users className="w-3.5 h-3.5" strokeWidth={1.8} />}
        trailing={onlineBadge}
      />

      <ScrollArea className="flex-1">
        <div className="py-2">

          {/* ── Tú ──────────────────────────────────────────────── */}
          {me && (
            <div className="px-1.5 mb-1">
              <MeRow member={me} />
            </div>
          )}

          {/* ── Separador ─────────────────────────────────────── */}
          {others.length > 0 && (
            <div className="px-3 mb-1">
              <Separator className="opacity-50" />
            </div>
          )}

          {/* ── Loading state ─────────────────────────────────── */}
          {isLoading && (
            <div className="px-4 py-3 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2.5 w-20 bg-[var(--color-bg-secondary)] rounded" />
                    <div className="h-2 w-14 bg-[var(--color-bg-secondary)] rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Online teammates ──────────────────────────────── */}
          {!isLoading && others.length === 0 && (
            <EmptySlate
              icon={<Users className="w-4 h-4" strokeWidth={1.5} />}
              title="Solo tú por ahora"
              description="Cuando otros se conecten aparecerán aquí."
            />
          )}

          {!isLoading && hasOnlineOthers && (
            <div className="px-1.5 space-y-px mb-1">
              {others.filter((m) => m.isOnline).map((member) => (
                <TeammateRow
                  key={member.id}
                  member={member}
                  unread={threads[member.id]?.unreadCount ?? 0}
                  onMessage={() => handleMessage(member)}
                  onCall={() => handleCall(member)}
                />
              ))}
            </div>
          )}

          {/* ── Offline teammates ────────────────────────────── */}
          {!isLoading && hasOfflineOthers && (
            <>
              <div className="px-3 mb-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--color-fg-quaternary)]">
                  Desconectados
                </p>
              </div>
              <div className="px-1.5 space-y-px">
                {others.filter((m) => !m.isOnline).map((member) => (
                  <TeammateRow
                    key={member.id}
                    member={member}
                    unread={threads[member.id]?.unreadCount ?? 0}
                    onMessage={() => handleMessage(member)}
                    onCall={() => handleCall(member)}
                    dimmed
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </Panel>
  )
}

// ─── MeRow ────────────────────────────────────────────────────────────────────

function MeRow({ member }: { member: TeamMember }) {
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl">
      <div className="relative flex-shrink-0">
        <UserAvatar
          name={member.name}
          avatarUrl={member.avatarUrl}
          status={member.status}
          size="sm"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate leading-tight">
            {member.name.split(' ')[0]}
          </p>
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] text-[var(--color-text-quaternary)] font-medium flex-shrink-0 leading-tight">
            tú
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', STATUS_DOT[member.status])} />
          <span className="text-[11px] text-[var(--color-text-quaternary)] truncate">
            {STATUS_LABEL[member.status]}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── TeammateRow ──────────────────────────────────────────────────────────────

function TeammateRow({
  member,
  unread,
  onMessage,
  onCall,
  dimmed = false,
}: {
  member:    TeamMember
  unread:    number
  onMessage: () => void
  onCall:    () => void
  dimmed?:   boolean
}) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors duration-fast cursor-default',
        dimmed
          ? 'opacity-50 hover:opacity-75 hover:bg-[var(--color-bg-primary_hover)]'
          : 'hover:bg-[var(--color-bg-primary_hover)]',
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <UserAvatar
          name={member.name}
          avatarUrl={member.avatarUrl}
          status={member.status}
          size="sm"
        />
        {member.isOnline && member.status === UserStatus.AVAILABLE && (
          <span className="absolute -bottom-0 -right-0 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-40" />
          </span>
        )}
      </div>

      {/* Identity */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate leading-tight">
            {member.name.split(' ')[0]}
          </p>
          {/* Unread DM badge */}
          {unread > 0 && (
            <span className="min-w-[16px] h-[16px] px-1 flex items-center justify-center text-[9px] font-bold bg-[var(--color-bg-brand-solid)] text-white rounded-full leading-none flex-shrink-0">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {member.isOnline ? (
            <>
              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', STATUS_DOT[member.status])} />
              <span className="text-[11px] text-[var(--color-text-quaternary)] truncate">
                {STATUS_LABEL[member.status]}
                {member.zoneId && (
                  <span className="ml-1 opacity-60">· {member.zoneId}</span>
                )}
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-2.5 h-2.5 text-[var(--color-fg-quaternary)] flex-shrink-0" strokeWidth={2} />
              <span className="text-[11px] text-[var(--color-text-quaternary)] truncate">
                Desconectado
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions — shown on hover */}
      {member.isOnline && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-100 flex items-center gap-1 flex-shrink-0">
          <ActionBtn icon={MessageSquare} title="Mensaje directo" onClick={onMessage} />
          <ActionBtn icon={Phone}         title="Llamar"          onClick={onCall}    />
        </div>
      )}
    </div>
  )
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────

function ActionBtn({
  icon: Icon,
  title,
  onClick,
}: {
  icon:    React.ElementType
  title:   string
  onClick: () => void
}) {
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="w-6 h-6 flex items-center justify-center rounded-md flex-shrink-0 text-[var(--color-text-quaternary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] border border-transparent hover:border-[var(--color-border-secondary)] transition-all duration-100"
    >
      <Icon className="w-[11px] h-[11px]" strokeWidth={2} />
    </button>
  )
}
