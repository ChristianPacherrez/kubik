'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { ChevronsUpDown, User, Settings, LogOut, Check } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useOfficeStore } from '@/store/office.store'
import { UserStatus } from '@/types'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: Array<{
  value: UserStatus
  label: string
  description: string
  dot: string
}> = [
  { value: UserStatus.AVAILABLE,  label: 'Disponible', description: 'Listo para colaborar',    dot: 'bg-success-500' },
  { value: UserStatus.BUSY,       label: 'Ocupado',    description: 'Trabajando, no molestar', dot: 'bg-warning-500' },
  { value: UserStatus.IN_MEETING, label: 'En reunión', description: 'En una llamada activa',   dot: 'bg-error-500'   },
  { value: UserStatus.AWAY,       label: 'Ausente',    description: 'Alejado del equipo',      dot: 'bg-gray-400'    },
]

export function UserMenu({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { userStatus, setUserStatus } = useOfficeStore()

  const userName   = user?.fullName ?? user?.username ?? 'Usuario'
  const userEmail  = user?.primaryEmailAddress?.emailAddress ?? ''
  const userAvatar = user?.imageUrl ?? null
  const current    = STATUS_OPTIONS.find((o) => o.value === userStatus) ?? STATUS_OPTIONS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isCollapsed ? (
          // ── Collapsed: avatar-only trigger ────────────────────────────────────
          <button
            title={userName}
            className={cn(
              'w-9 h-9 flex items-center justify-center rounded-lg',
              'transition-colors duration-fast',
              'hover:bg-[var(--color-bg-primary_hover)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-kubik-600'
            )}
          >
            <UserAvatar name={userName} avatarUrl={userAvatar} status={userStatus} size="sm" />
          </button>
        ) : (
          // ── Expanded: full trigger ─────────────────────────────────────────────
          <button className={cn(
            'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg',
            'text-left transition-colors duration-fast',
            'hover:bg-[var(--color-bg-primary_hover)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-kubik-600'
          )}>
            <UserAvatar name={userName} avatarUrl={userAvatar} status={userStatus} size="sm" />

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate leading-tight">
                {userName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', current.dot)} />
                <span className="text-[11px] text-[var(--color-text-quaternary)] truncate">{current.label}</span>
              </div>
            </div>

            <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--color-fg-quaternary)] flex-shrink-0" strokeWidth={2} />
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[210px]"
      >
        {/* User info header */}
        <div className="px-3 py-3 border-b border-[var(--color-border-secondary)]">
          <div className="flex items-center gap-2.5">
            <UserAvatar name={userName} avatarUrl={userAvatar} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{userName}</p>
              <p className="text-[11px] text-[var(--color-text-quaternary)] truncate mt-0.5">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Status selector */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Tu estado</DropdownMenuLabel>
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = userStatus === opt.value
            return (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setUserStatus(opt.value)}
                className={cn(isSelected && 'bg-[var(--color-bg-primary_hover)]')}
              >
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', opt.dot)} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[13px] font-medium leading-tight', isSelected && 'text-[var(--color-text-primary)]')}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-[var(--color-fg-quaternary)] mt-0.5">{opt.description}</p>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-kubik-600 flex-shrink-0" strokeWidth={2.5} />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Actions */}
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User strokeWidth={1.5} />
            Mi perfil
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings strokeWidth={1.5} />
            Configuración
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-error-500 focus:text-error-500 focus:bg-error-50 dark:focus:bg-error-500/10"
        >
          <LogOut strokeWidth={1.5} />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
