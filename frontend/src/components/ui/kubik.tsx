'use client'

// kubik.tsx — Shared Kubik design primitives
//
// Single source of truth for recurring UI patterns across the entire platform.
// All components consume these building blocks to guarantee visual consistency.
//
// Exports:
//   Panel           — opaque surface card (sidebar panels, right-rail widgets)
//   FloatingCard    — elevated overlay card (tooltips, map overlays, proximity)
//   SectionHeader   — labelled section divider with optional action slot
//   LiveBadge       — animated "● LIVE" indicator
//   PresenceDot     — single status dot (online / busy / meeting / away / offline)
//   PresenceBadge   — pill: dot + label text
//   UserPill        — mini avatar + first name + status dot
//   AvatarStack     — overlapping avatar row with overflow count
//   CapacityBar     — occupancy fill bar with percentage label
//   EmptySlate      — centered empty-state block with icon + copy

import { cn } from '@/lib/utils'
import { UserStatus } from '@/types'

// ─── Tokens ───────────────────────────────────────────────────────────────────

export const STATUS_DOT: Record<UserStatus, string> = {
  [UserStatus.AVAILABLE]:  'bg-emerald-500',
  [UserStatus.BUSY]:       'bg-amber-500',
  [UserStatus.IN_MEETING]: 'bg-rose-500',
  [UserStatus.AWAY]:       'bg-zinc-400',
  [UserStatus.OFFLINE]:    'bg-zinc-300 dark:bg-zinc-600',
}

export const STATUS_LABEL: Record<UserStatus, string> = {
  [UserStatus.AVAILABLE]:  'Disponible',
  [UserStatus.BUSY]:       'Ocupado',
  [UserStatus.IN_MEETING]: 'En reunión',
  [UserStatus.AWAY]:       'Ausente',
  [UserStatus.OFFLINE]:    'Desconectado',
}

// ─── Panel ────────────────────────────────────────────────────────────────────
// Opaque surface used for sidebar panels and right-rail widgets.
// bg-secondary + left/right border separates it from the main content area.

interface PanelProps {
  className?: string
  children: React.ReactNode
  side?: 'left' | 'right' | 'none'
}

export function Panel({ className, children, side = 'right' }: PanelProps) {
  return (
    <div className={cn(
      'flex flex-col h-full bg-[var(--color-bg-secondary)]',
      side === 'right' && 'border-l border-[var(--color-border-secondary)]',
      side === 'left'  && 'border-r border-[var(--color-border-secondary)]',
      className,
    )}>
      {children}
    </div>
  )
}

// ─── FloatingCard ─────────────────────────────────────────────────────────────
// Elevated overlay card: tooltips, map overlays, proximity panels, hover cards.
// Uses shadow-xl + backdrop-blur for depth without heavy dark backgrounds.

interface FloatingCardProps {
  className?: string
  children: React.ReactNode
  noPadding?: boolean
}

export function FloatingCard({ className, children, noPadding }: FloatingCardProps) {
  return (
    <div className={cn(
      'bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]',
      'rounded-xl shadow-lg backdrop-blur-sm',
      !noPadding && 'p-3',
      className,
    )}>
      {children}
    </div>
  )
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
// Labelled section divider with an optional trailing action button slot.

interface SectionHeaderProps {
  label: string
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({ label, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-2', className)}>
      <span className="text-[11px] font-semibold text-[var(--color-text-quaternary)] uppercase tracking-wider">
        {label}
      </span>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ─── LiveBadge ────────────────────────────────────────────────────────────────
// Animated "● LIVE" pill. Used on room cards, session banners, room nodes.

interface LiveBadgeProps {
  count?: number
  className?: string
  size?: 'sm' | 'md'
}

export function LiveBadge({ count, className, size = 'sm' }: LiveBadgeProps) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 rounded-full',
      'bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/25',
      size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1',
      className,
    )}>
      <span
        className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0"
        style={{ animation: 'subtlePulse 1s ease-in-out infinite' }}
      />
      <span className={cn(
        'font-bold text-rose-600 dark:text-rose-400 tracking-wide',
        size === 'sm' ? 'text-[10px]' : 'text-xs',
      )}>
        LIVE{count !== undefined ? ` · ${count}` : ''}
      </span>
    </div>
  )
}

// ─── PresenceDot ──────────────────────────────────────────────────────────────
// Single coloured dot reflecting UserStatus. Pass `pulse` for AVAILABLE.

interface PresenceDotProps {
  status: UserStatus
  pulse?: boolean
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

export function PresenceDot({ status, pulse, size = 'sm', className }: PresenceDotProps) {
  const sizeClass = size === 'xs' ? 'w-1.5 h-1.5' : size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'
  const shouldPulse = pulse ?? status === UserStatus.AVAILABLE

  return (
    <span className={cn('relative inline-flex flex-shrink-0', sizeClass, className)}>
      {shouldPulse && (
        <span className={cn(
          'animate-ping absolute inline-flex h-full w-full rounded-full opacity-50',
          STATUS_DOT[status],
        )} />
      )}
      <span className={cn('relative inline-flex rounded-full', sizeClass, STATUS_DOT[status])} />
    </span>
  )
}

// ─── PresenceBadge ────────────────────────────────────────────────────────────
// Dot + label pill. Used in team panels, user rows, hover cards.

interface PresenceBadgeProps {
  status: UserStatus
  className?: string
}

export function PresenceBadge({ status, className }: PresenceBadgeProps) {
  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <PresenceDot status={status} size="xs" />
      <span className="text-[11px] text-[var(--color-text-quaternary)]">
        {STATUS_LABEL[status]}
      </span>
    </div>
  )
}

// ─── UserPill ─────────────────────────────────────────────────────────────────
// Compact avatar + first name + presence dot.
// Used in RoomNode occupant lists, map tooltips, activity rows.

interface UserPillProps {
  name: string
  avatarUrl?: string | null
  status?: UserStatus
  className?: string
}

export function UserPill({ name, avatarUrl, status, className }: UserPillProps) {
  const initials = name.trim().split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  const colors = ['bg-kubik-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-sky-500', 'bg-rose-500']
  const bg = colors[name.charCodeAt(0) % colors.length]

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1',
      'bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)]',
      'rounded-lg text-[11px] font-medium text-[var(--color-text-secondary)]',
      className,
    )}>
      {/* Mini avatar */}
      <div className={cn(
        'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden text-[8px] font-bold text-white',
        !avatarUrl && bg,
      )}>
        {avatarUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          : initials
        }
      </div>
      <span className="truncate">{name.split(' ')[0]}</span>
      {status !== undefined && <PresenceDot status={status} size="xs" pulse={false} />}
    </div>
  )
}

// ─── AvatarStack ──────────────────────────────────────────────────────────────
// Overlapping avatar row (max visible + overflow count).

interface AvatarStackProps {
  users: Array<{ id: string; name: string; avatarUrl?: string | null }>
  max?: number
  size?: 'xs' | 'sm'
  className?: string
}

export function AvatarStack({ users, max = 4, size = 'sm', className }: AvatarStackProps) {
  const visible = users.slice(0, max)
  const overflow = users.length - visible.length
  const dim = size === 'xs' ? 'w-5 h-5 text-[7px]' : 'w-7 h-7 text-[9px]'
  const ring = 'ring-2 ring-[var(--color-bg-primary)]'
  const colors = ['bg-kubik-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-sky-500']

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex -space-x-1.5">
        {visible.map((u, i) => {
          const bg = colors[u.name.charCodeAt(0) % colors.length]
          return (
            <div
              key={u.id}
              title={u.name}
              className={cn(
                dim, ring, 'rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden',
                !u.avatarUrl && bg,
              )}
              style={{ zIndex: visible.length - i }}
            >
              {u.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                : u.name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
              }
            </div>
          )
        })}
        {overflow > 0 && (
          <div className={cn(
            dim, ring,
            'rounded-full flex items-center justify-center font-bold flex-shrink-0',
            'bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)]',
            'text-[var(--color-text-quaternary)]',
          )} style={{ zIndex: 0 }}>
            +{overflow}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CapacityBar ──────────────────────────────────────────────────────────────
// Slim fill bar with capacity label. Used in RoomCard, RoomNode.

interface CapacityBarProps {
  current: number
  max: number
  className?: string
  showLabel?: boolean
}

export function CapacityBar({ current, max, className, showLabel = true }: CapacityBarProps) {
  const pct = Math.round((current / max) * 100)
  const color = pct > 85 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--color-text-quaternary)]">{current} / {max} plazas</span>
          <span className="text-[10px] text-[var(--color-text-quaternary)]">{pct}%</span>
        </div>
      )}
      <div className="h-1 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── EmptySlate ───────────────────────────────────────────────────────────────
// Centered empty-state with icon, title, and optional description.

interface EmptySlateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptySlate({ icon, title, description, action, className }: EmptySlateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center px-6 py-12 gap-3',
      className,
    )}>
      <div className="
        w-12 h-12 rounded-2xl flex items-center justify-center
        bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)]
        text-[var(--color-text-quaternary)]
      ">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--color-text-secondary)]">{title}</p>
        {description && (
          <p className="text-xs text-[var(--color-text-quaternary)] max-w-[220px] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

// ─── PanelHeader ──────────────────────────────────────────────────────────────
// Consistent header row used inside Panel components (OnlineUsers, ChatPanel).

interface PanelHeaderProps {
  title: string
  icon?: React.ReactNode
  trailing?: React.ReactNode
  className?: string
}

export function PanelHeader({ title, icon, trailing, className }: PanelHeaderProps) {
  return (
    <div className={cn(
      'px-4 py-3 flex items-center justify-between flex-shrink-0',
      'border-b border-[var(--color-border-secondary)]',
      className,
    )}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-[var(--color-fg-quaternary)] flex-shrink-0">{icon}</span>}
        <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">{title}</h2>
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
    </div>
  )
}

// ─── RoomTypeBadge ────────────────────────────────────────────────────────────
// Type chip used on room cards (Abierto, Focus, Reunión, Lounge…)

interface RoomTypeBadgeProps {
  label: string
  color: 'violet' | 'emerald' | 'amber' | 'purple' | 'sky' | 'rose'
  className?: string
}

const BADGE_COLORS: Record<RoomTypeBadgeProps['color'], string> = {
  violet:  'bg-violet-50  text-violet-700  border-violet-200  dark:bg-violet-500/10  dark:text-violet-300  dark:border-violet-500/25',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25',
  amber:   'bg-amber-50   text-amber-700   border-amber-200   dark:bg-amber-500/10   dark:text-amber-300   dark:border-amber-500/25',
  purple:  'bg-purple-50  text-purple-700  border-purple-200  dark:bg-purple-500/10  dark:text-purple-300  dark:border-purple-500/25',
  sky:     'bg-sky-50     text-sky-700     border-sky-200     dark:bg-sky-500/10     dark:text-sky-300     dark:border-sky-500/25',
  rose:    'bg-rose-50    text-rose-700    border-rose-200    dark:bg-rose-500/10    dark:text-rose-300    dark:border-rose-500/25',
}

export function RoomTypeBadge({ label, color, className }: RoomTypeBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
      BADGE_COLORS[color],
      className,
    )}>
      {label}
    </span>
  )
}
