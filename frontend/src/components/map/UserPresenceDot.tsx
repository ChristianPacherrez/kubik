'use client'

// UserPresenceDot — avatar circular del usuario dentro de una sala del mapa
//
// Muestra las iniciales del usuario con un indicador de estado.
// Al hacer hover se muestra un tooltip con el nombre completo.

import { useState } from 'react'
import { User, UserStatus } from '@/types'

const STATUS_DOT_COLOR: Record<UserStatus, string> = {
  [UserStatus.AVAILABLE]:  'bg-green-500',
  [UserStatus.BUSY]:       'bg-orange-500',
  [UserStatus.IN_MEETING]: 'bg-red-500',
  [UserStatus.AWAY]:       'bg-zinc-400',
  [UserStatus.OFFLINE]:    'bg-zinc-500',
}

// Paleta de colores para el fondo del avatar (por inicial)
const AVATAR_PALETTE = [
  'bg-kubik-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-sky-600',
  'bg-teal-600',
]

function getAvatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[idx]
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface UserPresenceDotProps {
  user: User
  size?: 'xs' | 'sm'
}

export function UserPresenceDot({ user, size = 'xs' }: UserPresenceDotProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const sizeClasses = size === 'xs'
    ? 'w-6 h-6 text-[8px]'
    : 'w-8 h-8 text-[10px]'

  const dotSize = size === 'xs'
    ? 'w-2 h-2 -bottom-0.5 -right-0.5'
    : 'w-2.5 h-2.5 -bottom-0.5 -right-0.5'

  const bg = user.avatarUrl ? '' : getAvatarColor(user.name)

  return (
    <div
      className="relative flex-shrink-0"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Avatar */}
      <div className={`
        ${sizeClasses} ${bg}
        rounded-full flex items-center justify-center
        font-semibold text-white
        ring-1 ring-black/20
        cursor-default select-none
      `}>
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          getInitials(user.name)
        )}
      </div>

      {/* Indicador de estado */}
      <span className={`
        absolute ${dotSize}
        rounded-full ${STATUS_DOT_COLOR[user.status]}
        ring-1 ring-black/30
      `} />

      {/* Tooltip */}
      {showTooltip && (
        <div className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
          bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]
          rounded-lg px-2 py-1 shadow-xl shadow-black/40
          pointer-events-none z-50 whitespace-nowrap
        ">
          <p className="text-[11px] font-medium text-[var(--color-text-primary)]">{user.name}</p>
          <p className="text-[9px] text-[var(--color-text-quaternary)] capitalize">
            {user.status.toLowerCase().replace('_', ' ')}
          </p>
          {/* Flecha del tooltip */}
          <span className="
            absolute top-full left-1/2 -translate-x-1/2
            border-4 border-transparent border-t-[var(--color-border-secondary)]
          " />
        </div>
      )}
    </div>
  )
}
