'use client'

import { ChevronDown, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

export function StatusSelector() {
  const { userStatus, setUserStatus } = useOfficeStore()
  const current = STATUS_OPTIONS.find((o) => o.value === userStatus) ?? STATUS_OPTIONS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          'flex items-center gap-2 px-3 py-[6px] rounded-lg text-[12px] font-medium',
          'bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] shadow-xs',
          'hover:border-[var(--color-border-primary)] hover:bg-[var(--color-bg-primary_hover)]',
          'transition-all duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-kubik-600'
        )}>
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', current.dot)} />
          <span className="text-[var(--color-text-secondary)]">{current.label}</span>
          <ChevronDown className="w-3 h-3 text-[var(--color-fg-quaternary)]" strokeWidth={2.5} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="bottom" sideOffset={6} className="w-52">
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
