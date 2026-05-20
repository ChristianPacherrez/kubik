'use client'

import React, { useState } from 'react'
import { LogIn, LogOut, Circle, MessageSquare, Paperclip } from 'lucide-react'
import { useOfficeStore } from '@/store/office.store'
import { OFFICE_ZONES, ZONE_OCCUPANCY, MOCK_USERS, MOCK_ACTIVITY_FEED, type OfficeZone } from '@/lib/mock-data'
import { RelativeTime } from '@/components/ui/RelativeTime'
import { Room } from '@/types'

// ─── Mini avatar dentro de la zona ───────────────────────────────────────────

function ZoneAvatar({ userId, dotClass }: { userId: string; dotClass: string }) {
  const user = MOCK_USERS.find((u) => u.id === userId)
  if (!user) return null

  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="relative group" title={user.name}>
      <div className={`
        w-7 h-7 rounded-full ${dotClass} ring-2 ring-[var(--color-bg-primary)]
        flex items-center justify-center text-[9px] font-bold text-white
        transition-transform duration-150 hover:scale-110 cursor-pointer hover:ring-white/20
      `}>
        {initials}
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
        bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg
        text-[10px] text-[var(--color-text-secondary)] whitespace-nowrap
        opacity-0 group-hover:opacity-100 transition-opacity
        pointer-events-none z-30 shadow-xl">
        {user.name}
      </div>
    </div>
  )
}

// ─── Tarjeta de zona ─────────────────────────────────────────────────────────

function ZoneCard({
  zone,
  isActive,
  onClick,
}: {
  zone: OfficeZone
  isActive: boolean
  onClick: () => void
}) {
  const occupants = ZONE_OCCUPANCY[zone.id] ?? []
  const pct = Math.round((occupants.length / zone.maxCapacity) * 100)
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative flex flex-col gap-2.5 p-4 rounded-2xl border text-left w-full h-full
        theme-transition group overflow-hidden
        ${zone.borderClass} ${zone.bgClass}
        ${isActive
          ? `shadow-lg ${zone.glowClass} ring-1 ring-white/8 scale-[1.015]`
          : 'hover:scale-[1.01] hover:shadow-md hover:brightness-105'
        }
      `}
    >
      {/* Línea de acento superior */}
      <div className={`absolute inset-x-0 top-0 h-[3px] rounded-t-2xl ${zone.accent} opacity-70`} />

      {/* Decoración de fondo sutil */}
      <div className={`
        absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${zone.accent}
        opacity-[0.04] transition-all duration-300
        ${hovered || isActive ? 'opacity-[0.07] scale-110' : ''}
      `} />

      {/* Header: icono + nombre + ping activo */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`
            w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0
            ${zone.bgClass} border ${zone.borderClass}
            transition-transform duration-200
            ${hovered || isActive ? 'scale-105' : ''}
          `}>
            {zone.icon}
          </div>
          <div>
            <p className={`text-sm font-bold leading-tight ${isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
              {zone.name}
            </p>
            <p className="text-[10px] text-[var(--color-fg-quaternary)] mt-0.5 leading-tight">
              {zone.description}
            </p>
          </div>
        </div>

        {/* Indicador activo */}
        {isActive && (
          <span className="relative flex h-2 w-2 flex-shrink-0 mt-1">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${zone.accent}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${zone.accent}`} />
          </span>
        )}
      </div>

      {/* Avatares o estado vacío */}
      <div className="flex items-center gap-1 min-h-[28px] flex-wrap">
        {occupants.length > 0 ? (
          <>
            {occupants.slice(0, 5).map((uid) => (
              <ZoneAvatar key={uid} userId={uid} dotClass={zone.dotClass} />
            ))}
            {occupants.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)]
                flex items-center justify-center text-[9px] font-bold text-[var(--color-text-tertiary)]">
                +{occupants.length - 5}
              </div>
            )}
          </>
        ) : (
          <span className="text-[11px] text-[var(--color-fg-quaternary)] italic">Zona vacía</span>
        )}
      </div>

      {/* Barra de capacidad + botón unirse */}
      <div className="mt-auto space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--color-fg-quaternary)]">
            {occupants.length}/{zone.maxCapacity}
          </span>
          {isActive ? (
            <span className="text-[10px] font-medium text-[var(--color-text-brand-primary)]">
              Aquí
            </span>
          ) : (hovered && (
            <span className="text-[10px] font-medium text-[var(--color-text-brand-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
              Unirse →
            </span>
          ))}
        </div>
        <div className="h-1 w-full rounded-full bg-black/20 overflow-hidden">
          <div
            className={`h-full rounded-full ${zone.accent} transition-all duration-700`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </button>
  )
}

// ─── Feed de actividad ────────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  join:    (props: React.SVGProps<SVGSVGElement>) => <LogIn    size={10} strokeWidth={1.8} {...props} />,
  leave:   (props: React.SVGProps<SVGSVGElement>) => <LogOut   size={10} strokeWidth={1.8} {...props} />,
  status:  (props: React.SVGProps<SVGSVGElement>) => <Circle   size={8}  strokeWidth={2}   fill="currentColor" {...props} />,
  message: (props: React.SVGProps<SVGSVGElement>) => <MessageSquare size={10} strokeWidth={1.8} {...props} />,
  file:    (props: React.SVGProps<SVGSVGElement>) => <Paperclip     size={10} strokeWidth={1.8} {...props} />,
}

function ActivityFeed() {
  return (
    <div className="w-52 flex-shrink-0 flex flex-col border-l border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)]">
      <div className="px-4 py-3.5 border-b border-[var(--color-border-secondary)] flex-shrink-0">
        <h3 className="text-[11px] font-semibold text-[var(--color-text-quaternary)] uppercase tracking-wider">
          Actividad
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {MOCK_ACTIVITY_FEED.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-[var(--color-bg-primary_hover)] transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]
              flex items-center justify-center text-[var(--color-text-tertiary)] flex-shrink-0 mt-0.5">
              {(() => { const Icon = ACTIVITY_ICONS[event.type]; return Icon ? <Icon /> : <span className="text-[10px]">·</span> })()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[var(--color-text-tertiary)] leading-snug">
                <span className="text-[var(--color-text-secondary)] font-medium">
                  {event.userName.split(' ')[0]}
                </span>
                {' '}{event.action}{' '}
                {event.detail && (
                  <span className="text-kubik-400">{event.detail}</span>
                )}
              </p>
              {/* client-only: evita hydration mismatch */}
              <RelativeTime
                timestamp={event.timestamp}
                className="text-[10px] text-[var(--color-fg-quaternary)] mt-0.5 block"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── VirtualOffice — pieza central del Sprint 4 ───────────────────────────────

export function VirtualOffice() {
  const { currentRoom, setCurrentRoom } = useOfficeStore()

  const totalOnline = Object.values(ZONE_OCCUPANCY).flat().length
  const uniqueOnline = new Set(Object.values(ZONE_OCCUPANCY).flat()).size

  const handleZoneClick = (zone: OfficeZone) => {
    // Adaptar OfficeZone → Room para compatibilidad con el store
    const asRoom: Room = {
      id: zone.id,
      name: zone.name,
      maxCapacity: zone.maxCapacity,
      type: zone.type === 'lobby'    ? 'OPEN'
           : zone.type === 'focus'   ? 'FOCUS'
           : zone.type === 'meeting' ? 'MEETING'
           : 'LOUNGE',
    }
    setCurrentRoom(currentRoom?.id === zone.id ? null : asRoom)
  }

  const currentZone = currentRoom
    ? OFFICE_ZONES.find((z) => z.id === currentRoom.id)
    : null

  return (
    <div className="flex-1 flex overflow-hidden bg-[var(--color-bg-primary)]">

      {/* ── Área principal ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-secondary)] flex-shrink-0">
          <div>
            <h1 className="text-sm font-bold text-[var(--color-text-primary)]">
              Planta Principal
            </h1>
            <p className="text-xs text-[var(--color-text-quaternary)] mt-0.5">
              {currentZone
                ? `Estás en ${currentZone.icon} ${currentZone.name}`
                : 'Selecciona una zona para unirte'
              }
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">{uniqueOnline} online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-border-primary)]" />
              <span className="text-xs text-[var(--color-text-tertiary)]">{OFFICE_ZONES.length} zonas</span>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">

          {/* Fondo: cuadrícula de puntos */}
          <div className="absolute inset-0 grid-dots opacity-40" />

          {/* Degradado decorativo */}
          <div className="absolute inset-0 bg-gradient-to-br
            from-kubik-950/25 via-transparent to-violet-950/10 pointer-events-none" />

          {/* Corredor horizontal — separador entre filas */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 office-corridor-h pointer-events-none" />

          {/* Grid 3×2 de zonas */}
          <div className="relative h-full flex items-center justify-center p-6">
            <div className="grid grid-cols-3 grid-rows-2 gap-3.5 w-full max-w-2xl h-[320px]">
              {OFFICE_ZONES.map((zone) => (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  isActive={currentRoom?.id === zone.id}
                  onClick={() => handleZoneClick(zone)}
                />
              ))}
            </div>
          </div>

          {/* Badge de fase — esquina inferior */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--color-border-secondary)]" />
            <span className="text-[9px] text-[var(--color-fg-quaternary)] tracking-widest uppercase whitespace-nowrap">
              Mapa 2D interactivo · Sprint 5
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--color-border-secondary)]" />
          </div>
        </div>

        {/* Footer — pills de navegación rápida */}
        <div className="px-5 py-2.5 border-t border-[var(--color-border-secondary)] flex-shrink-0
          flex items-center gap-1.5 overflow-x-auto">
          {OFFICE_ZONES.map((zone) => {
            const isActive = currentRoom?.id === zone.id
            const count = ZONE_OCCUPANCY[zone.id]?.length ?? 0
            return (
              <button
                key={zone.id}
                onClick={() => handleZoneClick(zone)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium
                  whitespace-nowrap transition-all duration-150 border flex-shrink-0
                  ${isActive
                    ? 'bg-[var(--color-bg-brand-primary)] border-[var(--color-border-brand)] text-[var(--color-text-brand-primary)]'
                    : 'text-[var(--color-text-quaternary)] border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)] hover:text-[var(--color-text-secondary)]'
                  }
                `}
              >
                <span>{zone.icon}</span>
                {zone.name}
                <span className={`text-[10px] ${isActive ? 'text-[var(--color-text-brand-primary)]' : 'text-[var(--color-fg-quaternary)]'}`}>
                  ({count})
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Feed de actividad (columna derecha) ──────────────────── */}
      <ActivityFeed />
    </div>
  )
}
