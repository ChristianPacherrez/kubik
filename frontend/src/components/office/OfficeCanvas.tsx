'use client'

import React from 'react'
import { LogIn, LogOut, Circle, MessageSquare, Paperclip } from 'lucide-react'
import { useOfficeStore } from '@/store/office.store'
import { UserAvatar as Avatar } from '@/components/ui/UserAvatar'
import { MOCK_ROOM_OCCUPANCY, MOCK_USERS, MOCK_ACTIVITY_FEED } from '@/lib/mock-data'
import { Room } from '@/types'
import { getRelativeTime } from '@/lib/utils'

// ─── Paleta visual por tipo de sala ──────────────────────────────────────────

const ROOM_STYLE: Record<Room['type'], {
  border: string; bg: string; glow: string
  dot: string; label: string; icon: string
  accentBg: string; textColor: string
}> = {
  OPEN:    { border: 'border-kubik-500/40',   bg: 'bg-kubik-500/5',    glow: 'shadow-kubik-500/20',   dot: 'bg-kubik-400',    label: 'text-kubik-400',    icon: '🏠', accentBg: 'bg-kubik-500/10',   textColor: 'text-kubik-300'   },
  FOCUS:   { border: 'border-emerald-500/40', bg: 'bg-emerald-500/5',  glow: 'shadow-emerald-500/20', dot: 'bg-emerald-400',  label: 'text-emerald-400',  icon: '🎯', accentBg: 'bg-emerald-500/10', textColor: 'text-emerald-300' },
  MEETING: { border: 'border-amber-500/40',   bg: 'bg-amber-500/5',    glow: 'shadow-amber-500/20',   dot: 'bg-amber-400',    label: 'text-amber-400',    icon: '📋', accentBg: 'bg-amber-500/10',   textColor: 'text-amber-300'   },
  LOUNGE:  { border: 'border-purple-500/40',  bg: 'bg-purple-500/5',   glow: 'shadow-purple-500/20',  dot: 'bg-purple-400',   label: 'text-purple-400',   icon: '☕', accentBg: 'bg-purple-500/10',  textColor: 'text-purple-300'  },
}

const OCCUPANCY_PERCENT: Record<string, number> = {
  lobby: 75, dev: 25, 'meeting-1': 50, lounge: 0,
}

// ─── Mini avatar en el canvas ────────────────────────────────────────────────

function UserDot({ userId, dotColor }: { userId: string; dotColor: string }) {
  const user = MOCK_USERS.find((u) => u.id === userId)
  if (!user) return null

  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)

  return (
    <div className="relative group" title={user.name}>
      <div className={`
        w-7 h-7 rounded-full ${dotColor} ring-2 ring-[var(--color-bg-primary)]
        flex items-center justify-center text-[9px] font-bold text-white
        transition-transform duration-150 hover:scale-115 cursor-pointer
        hover:ring-white/20
      `}>
        {initials}
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
        bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg text-[10px] text-[var(--color-text-secondary)]
        whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity
        pointer-events-none z-20 shadow-xl">
        {user.name}
      </div>
    </div>
  )
}

// ─── Tarjeta de sala mejorada ────────────────────────────────────────────────

function RoomCard({ room, isActive, onClick }: { room: Room; isActive: boolean; onClick: () => void }) {
  const s = ROOM_STYLE[room.type]
  const occupants = MOCK_ROOM_OCCUPANCY[room.id] ?? []
  const pct = OCCUPANCY_PERCENT[room.id] ?? 0

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col gap-3 p-4 rounded-2xl border text-left
        transition-all duration-200 w-full h-full group
        ${s.border} ${s.bg}
        ${isActive
          ? `shadow-lg ${s.glow} scale-[1.02] ring-1 ring-white/5`
          : 'hover:scale-[1.01] hover:shadow-md hover:brightness-105'
        }
      `}
    >
      {/* Línea superior de acento */}
      <div className={`absolute inset-x-0 top-0 h-0.5 rounded-t-2xl ${s.dot} opacity-60`} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${s.accentBg} flex items-center justify-center text-base flex-shrink-0`}>
            {s.icon}
          </div>
          <div>
            <p className={`text-sm font-bold ${isActive ? 'text-[var(--color-text-primary)]' : s.textColor}`}>
              {room.name}
            </p>
            <p className="text-[10px] text-[var(--color-fg-quaternary)] mt-0.5">
              {room.type === 'OPEN' ? 'Acceso libre' : room.type === 'FOCUS' ? 'Sin interrupciones' : room.type === 'MEETING' ? 'Reunión activa' : 'Zona casual'}
            </p>
          </div>
        </div>

        {/* Indicador activo */}
        {isActive && (
          <span className="relative flex h-2 w-2 flex-shrink-0 mt-1">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${s.dot}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${s.dot}`} />
          </span>
        )}
      </div>

      {/* Avatares de usuarios */}
      <div className="flex items-center gap-1 min-h-[28px] flex-wrap">
        {occupants.length > 0 ? (
          occupants.map((uid) => (
            <UserDot key={uid} userId={uid} dotColor={s.dot} />
          ))
        ) : (
          <span className="text-[11px] text-[var(--color-fg-quaternary)] italic">Sala vacía</span>
        )}
      </div>

      {/* Barra de capacidad */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[var(--color-fg-quaternary)]">{occupants.length}/{room.maxCapacity}</span>
          <span className={`text-[10px] ${s.label} opacity-80`}>{pct}%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-black/20 overflow-hidden">
          <div className={`h-full rounded-full ${s.dot} transition-all duration-700`}
            style={{ width: `${pct}%` }} />
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
    <div className="w-56 flex-shrink-0 flex flex-col border-l border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)]">
      <div className="px-4 py-3.5 border-b border-[var(--color-border-secondary)]">
        <h3 className="text-xs font-semibold text-[var(--color-text-quaternary)] uppercase tracking-wider">
          Actividad
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {MOCK_ACTIVITY_FEED.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-2.5 px-2 py-2 rounded-lg
              hover:bg-[var(--color-bg-primary_hover)] transition-colors"
          >
            {/* Icono del evento */}
            <div className="w-6 h-6 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]
              flex items-center justify-center text-[var(--color-text-tertiary)] flex-shrink-0 mt-0.5">
              {(() => { const Icon = ACTIVITY_ICONS[event.type]; return Icon ? <Icon /> : <span className="text-[10px]">·</span> })()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[var(--color-text-tertiary)] leading-snug">
                <span className="text-[var(--color-text-secondary)] font-medium">{event.userName.split(' ')[0]}</span>
                {' '}{event.action}{' '}
                {event.detail && (
                  <span className="text-kubik-400">{event.detail}</span>
                )}
              </p>
              <p className="text-[10px] text-[var(--color-fg-quaternary)] mt-0.5">
                {getRelativeTime(event.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── OfficeCanvas principal ───────────────────────────────────────────────────

export function OfficeCanvas() {
  const { currentRoom, setCurrentRoom } = useOfficeStore()

  const CANVAS_ROOMS: Room[] = [
    { id: 'lobby',     name: 'Lobby',            maxCapacity: 20, type: 'OPEN'    },
    { id: 'dev',       name: 'Dev Room',          maxCapacity: 8,  type: 'FOCUS'   },
    { id: 'meeting-1', name: 'Sala de Reuniones', maxCapacity: 10, type: 'MEETING' },
    { id: 'lounge',    name: 'Lounge',            maxCapacity: 15, type: 'LOUNGE'  },
  ]

  const totalOnline = Object.values(MOCK_ROOM_OCCUPANCY).flat().length

  const handleRoomClick = (room: Room) => {
    setCurrentRoom(currentRoom?.id === room.id ? null : room)
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-[var(--color-bg-primary)]">

      {/* ── Área principal del canvas ─────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-secondary)] flex-shrink-0">
          <div>
            <h1 className="text-base font-bold text-[var(--color-text-primary)]">
              Planta Principal
            </h1>
            <p className="text-xs text-[var(--color-text-quaternary)] mt-0.5">
              {currentRoom
                ? `Estás en: ${currentRoom.name}`
                : 'Selecciona una sala para unirte'
              }
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">{totalOnline} online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-border-primary)]" />
              <span className="text-xs text-[var(--color-text-tertiary)]">{CANVAS_ROOMS.length} salas</span>
            </div>
          </div>
        </div>

        {/* Canvas con fondo */}
        <div className="flex-1 relative overflow-hidden">
          {/* Fondo: cuadrícula de puntos */}
          <div className="absolute inset-0 grid-dots opacity-50" />

          {/* Gradiente decorativo */}
          <div className="absolute inset-0 bg-gradient-to-br
            from-kubik-950/30 via-transparent to-purple-950/15 pointer-events-none" />

          {/* Contenido */}
          <div className="relative h-full flex flex-col items-center justify-center p-8 gap-5">

            {/* Rooms: 2 columnas, distribución tipo plano */}
            <div className="grid grid-cols-2 gap-3.5 w-full max-w-lg">
              {CANVAS_ROOMS.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  isActive={currentRoom?.id === room.id}
                  onClick={() => handleRoomClick(room)}
                />
              ))}
            </div>

            {/* Divider de fase */}
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--color-border-secondary)]" />
              <span className="text-[10px] text-[var(--color-fg-quaternary)] tracking-widest uppercase">
                Mapa 2D interactivo · Phase 4
              </span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--color-border-secondary)]" />
            </div>
          </div>
        </div>

        {/* Footer — selector de sala rápido */}
        <div className="px-6 py-3 border-t border-[var(--color-border-secondary)] flex-shrink-0
          flex items-center gap-2 overflow-x-auto">
          {CANVAS_ROOMS.map((room) => {
            const s = ROOM_STYLE[room.type]
            const isActive = currentRoom?.id === room.id
            return (
              <button
                key={room.id}
                onClick={() => handleRoomClick(room)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  whitespace-nowrap transition-all duration-150 border flex-shrink-0
                  ${isActive
                    ? `${s.bg} ${s.border} ${s.label}`
                    : 'text-[var(--color-text-quaternary)] border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)] hover:text-[var(--color-text-secondary)]'
                  }
                `}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${isActive ? 'opacity-100' : 'opacity-30'}`} />
                {room.name}
                <span className="opacity-50">
                  ({MOCK_ROOM_OCCUPANCY[room.id]?.length ?? 0})
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Feed de actividad (columna derecha del canvas) ────── */}
      <ActivityFeed />
    </div>
  )
}
