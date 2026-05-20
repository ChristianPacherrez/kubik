'use client'

// Sidebar — navegación lateral de Kubik
//
// Estados:
//   Expandido (220px) — icono + label + badges
//   Colapsado  (52px) — solo iconos, tooltip en hover
//
// Comportamiento:
//   · Botón colapsar/expandir siempre accesible en la parte inferior
//   · Botón fijar/desfijar — cuando está fijado el sidebar no se puede colapsar
//     automáticamente; cuando no está fijado el usuario puede colapsarlo a voluntad.
//   · Ambos estados se persisten en localStorage.
//
// Inspiración: Linear, Notion, Untitled UI.

import { useEffect, useState } from 'react'
import {
  Monitor,
  Users,
  MessageSquare,
  Settings,
  Boxes,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserMenu } from '@/components/layout/UserMenu'

// ─── localStorage keys ────────────────────────────────────────────────────────

const LS_COLLAPSED = 'kubik-sidebar-collapsed'
const LS_PINNED    = 'kubik-sidebar-pinned'

// ─── Nav config ───────────────────────────────────────────────────────────────

export type NavSection = 'office' | 'team' | 'messages' | 'settings'

interface SidebarProps {
  activeSection: NavSection
  onSectionChange: (section: NavSection) => void
}

const MAIN_NAV: Array<{
  id: NavSection
  label: string
  icon: React.ElementType
  badge?: number
}> = [
  { id: 'office',   label: 'Office',    icon: Monitor        },
  { id: 'team',     label: 'Team',      icon: Users          },
  { id: 'messages', label: 'Messages',  icon: MessageSquare, badge: 3 },
]

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({
  id,
  label,
  icon: Icon,
  badge,
  isActive,
  onClick,
  isCollapsed,
}: {
  id: NavSection
  label: string
  icon: React.ElementType
  badge?: number
  isActive: boolean
  onClick: () => void
  isCollapsed: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      data-active={isActive}
      className={cn(
        'group relative flex items-center rounded-lg text-[13px] transition-all duration-[150ms]',
        isCollapsed
          ? 'w-9 h-9 justify-center mx-auto px-0 py-0'
          : 'w-full gap-2.5 px-3 py-[7px]',
        isActive
          ? 'bg-[var(--color-bg-primary_hover)] text-[var(--color-text-primary)] font-semibold'
          : 'text-[var(--color-text-tertiary)] font-normal hover:bg-[var(--color-bg-primary_hover)] hover:text-[var(--color-text-secondary)]'
      )}
    >
      {/* Active accent bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-5 bg-kubik-600 rounded-r-full" />
      )}

      {/* Icon */}
      <Icon
        className={cn(
          'flex-shrink-0 transition-colors duration-[150ms]',
          isCollapsed ? 'w-[15px] h-[15px]' : 'w-[15px] h-[15px]',
          isActive
            ? 'text-kubik-600'
            : 'text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]'
        )}
        strokeWidth={1.6}
      />

      {/* Label + badge — ocultos en modo colapsado */}
      {!isCollapsed && (
        <>
          <span className="flex-1 text-left leading-none">{label}</span>
          {badge && !isActive && (
            <Badge className="min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold leading-none">
              {badge}
            </Badge>
          )}
        </>
      )}

      {/* Badge en modo colapsado — solo punto indicador */}
      {isCollapsed && badge && !isActive && (
        <span className="absolute top-1 right-1 w-[6px] h-[6px] rounded-full bg-[var(--color-bg-brand-solid)]" />
      )}
    </button>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  // Lee desde localStorage solo en el cliente — SSR-safe
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(LS_COLLAPSED) === 'true'
  })
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    // Por defecto: fijado (true). Solo es false si explícitamente se guardó 'false'.
    return localStorage.getItem(LS_PINNED) !== 'false'
  })

  // Persistir cambios
  useEffect(() => { localStorage.setItem(LS_COLLAPSED, String(isCollapsed)) }, [isCollapsed])
  useEffect(() => { localStorage.setItem(LS_PINNED,    String(isPinned))    }, [isPinned])

  const toggleCollapsed = () => setIsCollapsed((c) => !c)
  const togglePinned    = () => setIsPinned((p) => !p)

  return (
    <aside
      style={{
        width:      isCollapsed ? 52 : 220,
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      className="flex-shrink-0 flex flex-col h-full bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-secondary)] theme-transition overflow-hidden"
    >

      {/* ── Logo / Workspace ──────────────────────────────────── */}
      <div
        style={{
          padding:    isCollapsed ? '20px 0 16px' : '20px 16px 16px',
          transition: 'padding 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="flex-shrink-0"
      >
        {isCollapsed ? (
          // Sólo el cubo
          <div className="flex justify-center">
            <div className="w-[30px] h-[30px] rounded-[8px] bg-kubik-600 flex items-center justify-center shadow-glow-kubik">
              <Boxes className="w-[15px] h-[15px] text-white" strokeWidth={2} />
            </div>
          </div>
        ) : (
          // Logo completo + controles
          <div className="flex items-center gap-2.5">
            <div className="w-[30px] h-[30px] rounded-[8px] bg-kubik-600 flex items-center justify-center flex-shrink-0 shadow-glow-kubik">
              <Boxes className="w-[15px] h-[15px] text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-none tracking-tight text-[var(--color-text-primary)]">
                Kubik
              </p>
              <p className="text-[10px] mt-[3px] leading-none text-[var(--color-text-quaternary)]">
                Workspace
              </p>
            </div>

            {/* ── Pin toggle ──────────────────────────── */}
            <button
              onClick={togglePinned}
              title={isPinned ? 'Desfijar sidebar' : 'Fijar sidebar'}
              className={cn(
                'w-[22px] h-[22px] flex items-center justify-center rounded-md flex-shrink-0 transition-colors duration-[150ms]',
                isPinned
                  ? 'text-kubik-600 hover:bg-[var(--color-bg-primary_hover)]'
                  : 'text-[var(--color-text-quaternary)] hover:bg-[var(--color-bg-primary_hover)] hover:text-[var(--color-text-secondary)]'
              )}
            >
              {isPinned
                ? <Pin    className="w-[11px] h-[11px]" strokeWidth={2.2} />
                : <PinOff className="w-[11px] h-[11px]" strokeWidth={2.2} />
              }
            </button>
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <ScrollArea
        style={{
          padding: isCollapsed ? '0 6px' : '0 10px',
          transition: 'padding 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="flex-1"
      >
        <div className="pb-2">
          {/* Section label — oculto en modo colapsado */}
          {!isCollapsed && (
            <p className="text-label-xs font-semibold uppercase tracking-[0.08em] px-3 mb-1.5 text-[var(--color-fg-quaternary)]">
              Workspace
            </p>
          )}

          <div className={cn('space-y-px', isCollapsed && 'flex flex-col items-center')}>
            {MAIN_NAV.map(({ id, label, icon, badge }) => (
              <NavItem
                key={id}
                id={id}
                label={label}
                icon={icon}
                badge={badge}
                isActive={activeSection === id}
                onClick={() => onSectionChange(id)}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>

          <Separator className={cn('my-3 opacity-60', isCollapsed && 'w-6 mx-auto')} />

          <NavItem
            id="settings"
            label="Settings"
            icon={Settings}
            isActive={activeSection === 'settings'}
            onClick={() => onSectionChange('settings')}
            isCollapsed={isCollapsed}
          />
        </div>
      </ScrollArea>

      {/* ── Footer: colapsar + usuario ────────────────────────── */}
      <div
        style={{
          padding: isCollapsed ? '8px 6px 12px' : '8px 10px 12px',
          transition: 'padding 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="flex-shrink-0"
      >
        <Separator className="mb-2.5 opacity-60" />

        {/* Collapse / expand toggle */}
        <button
          onClick={toggleCollapsed}
          title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          className={cn(
            'flex items-center gap-2 rounded-lg text-[12px] font-medium transition-colors duration-150 mb-1.5',
            'text-[var(--color-text-quaternary)] hover:bg-[var(--color-bg-primary_hover)] hover:text-[var(--color-text-secondary)]',
            isCollapsed
              ? 'w-9 h-9 justify-center mx-auto px-0'
              : 'w-full px-3 py-[7px]'
          )}
        >
          {isCollapsed ? (
            <PanelLeftOpen  className="w-[14px] h-[14px] flex-shrink-0" strokeWidth={1.6} />
          ) : (
            <>
              <PanelLeftClose className="w-[14px] h-[14px] flex-shrink-0" strokeWidth={1.6} />
              <span className="leading-none">Colapsar</span>
            </>
          )}
        </button>

        {/* User menu */}
        <UserMenu isCollapsed={isCollapsed} />
      </div>
    </aside>
  )
}
