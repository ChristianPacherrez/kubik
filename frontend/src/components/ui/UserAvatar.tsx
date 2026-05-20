// UserAvatar — avatar con foto + iniciales + indicador de presencia
// Uso: <UserAvatar name="Ana" avatarUrl={null} status="AVAILABLE" size="md" />

import Image from 'next/image'
import { UserStatus, STATUS_COLORS } from '@/types'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name: string
  avatarUrl: string | null
  status?: UserStatus
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  xs: { container: 'w-6 h-6',   text: 'text-[9px]', dot: 'w-2 h-2'     },
  sm: { container: 'w-8 h-8',   text: 'text-xs',    dot: 'w-2.5 h-2.5' },
  md: { container: 'w-10 h-10', text: 'text-sm',    dot: 'w-3 h-3'     },
  lg: { container: 'w-14 h-14', text: 'text-base',  dot: 'w-4 h-4'     },
}

const BG_COLORS = [
  'bg-kubik-600', 'bg-violet-600', 'bg-indigo-600', 'bg-sky-600',
  'bg-emerald-600', 'bg-teal-600', 'bg-rose-600', 'bg-orange-600',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length]
}

export function UserAvatar({ name, avatarUrl, status, size = 'md', className }: UserAvatarProps) {
  const s = SIZE_CLASSES[size]
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const bgColor = getAvatarColor(name)

  return (
    <div className={cn('relative inline-flex flex-shrink-0', s.container, className)}>
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name}
          fill
          className="rounded-full object-cover"
          sizes="56px"
        />
      ) : (
        <div className={cn(s.container, s.text, bgColor, 'rounded-full flex items-center justify-center text-white font-semibold select-none')}>
          {initials}
        </div>
      )}

      {status && (
        <span
          className={cn('absolute bottom-0 right-0 rounded-full ring-2 ring-[var(--color-bg-primary)]', s.dot, STATUS_COLORS[status])}
          aria-label={`Estado: ${status}`}
        />
      )}
    </div>
  )
}
