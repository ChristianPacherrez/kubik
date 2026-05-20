'use client'

// TeamView — sección "Team" del NAV
//
// Fuente de datos: useTeamDirectory()
//   · Misma fuente que OnlineUsers (panel derecho de Office)
//   · Supabase `profiles` + Supabase Presence peers + usuario actual
//
// Acción "Mensaje":
//   · openChat() — establece openChatId en interaction.store
//   · onNavigate('messages') — navega a la sección Messages

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { useTeamDirectory, TeamMember } from '@/hooks/useTeamDirectory'
import { useInteractionStore } from '@/store/interaction.store'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { STATUS_DOT, STATUS_LABEL } from '@/components/ui/kubik'
import { cn } from '@/lib/utils'
import type { NavSection } from '@/components/layout/Sidebar'

// ─── MemberCard ───────────────────────────────────────────────────────────────

function MemberCard({
  member,
  onMessage,
}: {
  member:    TeamMember
  onMessage: () => void
}) {
  return (
    <div className="
      group relative flex flex-col gap-3 p-4 rounded-xl
      bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)]
      hover:border-[var(--color-border-primary)] hover:bg-[var(--color-bg-primary)]
      transition-all duration-200
    ">
      {/* Online pulse — esquina superior derecha */}
      {member.isOnline && (
        <div className="absolute top-3 right-3">
          <span className="relative flex h-2 w-2">
            <span className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-50',
              STATUS_DOT[member.status],
            )} />
            <span className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              STATUS_DOT[member.status],
            )} />
          </span>
        </div>
      )}

      {/* Avatar + nombre */}
      <div className="flex items-center gap-3">
        <UserAvatar
          name={member.name}
          avatarUrl={member.avatarUrl}
          status={member.status}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {member.name}
            </p>
            {member.isMe && (
              <span className="
                text-[9px] font-bold text-kubik-400 bg-kubik-500/10
                border border-kubik-500/20 px-1.5 py-0.5 rounded-full
                leading-none flex-shrink-0
              ">
                Tú
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--color-text-quaternary)] truncate mt-0.5">
            {member.zoneId ? `📍 ${member.zoneId}` : (member.isOnline ? STATUS_LABEL[member.status] : 'Desconectado')}
          </p>
        </div>
      </div>

      {/* Fila de estado */}
      <div className="flex items-center gap-1.5">
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_DOT[member.status])} />
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {member.isOnline ? STATUS_LABEL[member.status] : 'Desconectado'}
        </span>
      </div>

      {/* Acciones — aparecen en hover, solo para compañeros */}
      {!member.isMe && (
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={onMessage}
            className="
              flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5
              rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]
              text-xs text-[var(--color-text-tertiary)]
              hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-primary)]
              transition-all
            "
          >
            <MessageSquare size={11} strokeWidth={1.8} />
            Mensaje
          </button>
        </div>
      )}
    </div>
  )
}

// ─── TeamView ─────────────────────────────────────────────────────────────────

export function TeamView({ onNavigate }: { onNavigate?: (section: NavSection) => void }) {
  const { members, isLoading } = useTeamDirectory()
  const [filter, setFilter] = useState<'all' | 'online' | 'away'>('all')

  const handleMessage = (member: TeamMember) => {
    useInteractionStore.getState().openChat(member.id, member.name)
    onNavigate?.('messages')
  }

  // Ordenar: yo primero, luego online, luego offline (alfabético dentro de cada grupo)
  const sorted = [...members].sort((a, b) => {
    if (a.isMe && !b.isMe) return -1
    if (!a.isMe && b.isMe) return 1
    if (a.isOnline && !b.isOnline) return -1
    if (!a.isOnline && b.isOnline) return 1
    return a.name.localeCompare(b.name)
  })

  const filtered = sorted.filter((m) => {
    if (filter === 'online') return m.isOnline
    if (filter === 'away')   return !m.isOnline
    return true
  })

  const onlineCount = members.filter((m) => m.isOnline).length
  const awayCount   = members.filter((m) => !m.isOnline).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-primary)]">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-[var(--color-border-secondary)] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Tu equipo</h1>
            <p className="text-xs text-[var(--color-text-quaternary)] mt-0.5">
              {onlineCount} disponibles · {awayCount} ausentes
            </p>
          </div>

          {/* Filtros */}
          <div className="flex items-center bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg p-0.5 gap-0.5">
            {(['all', 'online', 'away'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                  filter === f
                    ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-quaternary)] hover:text-[var(--color-text-secondary)]',
                )}
              >
                {f === 'all' ? 'Todos' : f === 'online' ? '🟢 Online' : '⚪ Ausentes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid de miembros ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          // Skeleton de carga
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-[var(--color-bg-secondary)] animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <p className="text-sm text-[var(--color-fg-quaternary)]">
              No hay usuarios en este filtro
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onMessage={() => handleMessage(member)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
