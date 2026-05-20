'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useOfficeStore } from '@/store/office.store'
import { MOCK_ROOM_OCCUPANCY, MOCK_USERS } from '@/lib/mock-data'
import { RoomTypeBadge, AvatarStack, CapacityBar } from '@/components/ui/kubik'
import { Room } from '@/types'

// ─── Room config ──────────────────────────────────────────────────────────────

const ROOM_CONFIG: Record<Room['type'], {
  color: 'violet' | 'emerald' | 'amber' | 'purple'
  icon: string
  label: string
  description: string
  accent: string
}> = {
  OPEN:    { color: 'violet',  icon: '🏠', label: 'Abierto',  description: 'Acceso libre para todo el equipo',         accent: 'border-violet-500'  },
  FOCUS:   { color: 'emerald', icon: '🎯', label: 'Focus',    description: 'Trabajo concentrado, sin interrupciones',   accent: 'border-emerald-500' },
  MEETING: { color: 'amber',   icon: '📋', label: 'Reunión',  description: 'Sala para reuniones y llamadas',            accent: 'border-amber-500'   },
  LOUNGE:  { color: 'purple',  icon: '☕', label: 'Lounge',   description: 'Zona de descanso y conversación',           accent: 'border-purple-500'  },
}

// ─── Filter options ───────────────────────────────────────────────────────────

type FilterKey = 'ALL' | Room['type']

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'ALL',     label: 'Todas'   },
  { key: 'OPEN',    label: 'Abiertas' },
  { key: 'FOCUS',   label: 'Focus'   },
  { key: 'MEETING', label: 'Reunión' },
  { key: 'LOUNGE',  label: 'Lounge'  },
]

// ─── RoomCard ─────────────────────────────────────────────────────────────────

function RoomCard({ room, onJoin }: { room: Room; onJoin: () => void }) {
  const cfg = ROOM_CONFIG[room.type]
  const occupantIds = MOCK_ROOM_OCCUPANCY[room.id] ?? []
  const occupants = occupantIds
    .map((id) => MOCK_USERS.find((u) => u.id === id))
    .filter((u): u is (typeof MOCK_USERS)[number] => u !== undefined)
  const isFull = occupants.length >= room.maxCapacity

  return (
    <div className={`
      relative flex flex-col gap-4 p-5 rounded-xl
      border-l-2 ${cfg.accent}
      border border-[var(--color-border-secondary)]
      bg-[var(--color-bg-primary)]
      shadow-xs
      hover:shadow-md hover:border-[var(--color-border-primary)]
      transition-all duration-200
    `}>

      {/* Header: icon box + name/description + type badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="
            w-10 h-10 rounded-lg flex-shrink-0
            bg-[var(--color-bg-brand-primary)]
            flex items-center justify-center text-xl
          ">
            {cfg.icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {room.name}
            </h3>
            <p className="text-xs text-[var(--color-text-quaternary)] mt-0.5 leading-snug">
              {cfg.description}
            </p>
          </div>
        </div>
        <RoomTypeBadge label={cfg.label} color={cfg.color} className="flex-shrink-0 mt-0.5" />
      </div>

      {/* Participant avatars */}
      <div className="flex items-center gap-2 min-h-[28px]">
        {occupants.length > 0 ? (
          <>
            <AvatarStack users={occupants} max={4} size="sm" />
            <span className="text-xs text-[var(--color-text-quaternary)]">
              {occupants.length} {occupants.length === 1 ? 'persona' : 'personas'}
            </span>
          </>
        ) : (
          <span className="text-xs text-[var(--color-text-quaternary)] italic">
            Sala vacía
          </span>
        )}
      </div>

      {/* Capacity bar */}
      <CapacityBar current={occupants.length} max={room.maxCapacity} />

      {/* Join button */}
      <button
        onClick={onJoin}
        disabled={isFull}
        className={`
          w-full py-2 rounded-lg text-sm font-medium transition-colors
          ${isFull
            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-quaternary)] cursor-not-allowed border border-[var(--color-border-secondary)]'
            : 'bg-[var(--color-bg-brand-solid)] text-white hover:bg-[var(--color-bg-brand-solid_hover)]'
          }
        `}
      >
        {isFull ? 'Sala llena' : 'Unirse'}
      </button>
    </div>
  )
}

// ─── RoomsView ────────────────────────────────────────────────────────────────

const ROOMS: Room[] = [
  { id: 'lobby',     name: 'Lobby',            maxCapacity: 20, type: 'OPEN'    },
  { id: 'dev',       name: 'Dev Room',          maxCapacity: 8,  type: 'FOCUS'   },
  { id: 'meeting-1', name: 'Sala de Reuniones', maxCapacity: 10, type: 'MEETING' },
  { id: 'lounge',    name: 'Lounge',            maxCapacity: 15, type: 'LOUNGE'  },
]

export function RoomsView() {
  const { setCurrentRoom } = useOfficeStore()
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL')

  const filteredRooms = activeFilter === 'ALL'
    ? ROOMS
    : ROOMS.filter((r) => r.type === activeFilter)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-secondary)]">

      {/* Page header */}
      <div className="px-6 py-5 border-b border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Salas</h1>
            <p className="text-xs text-[var(--color-text-quaternary)] mt-0.5">
              {ROOMS.length} salas disponibles en este workspace
            </p>
          </div>
          <button className="
            inline-flex items-center gap-2 px-4 py-2 rounded-lg
            bg-[var(--color-bg-brand-solid)] text-white text-sm font-medium
            hover:bg-[var(--color-bg-brand-solid_hover)] transition-colors
          ">
            <Plus size={14} strokeWidth={2.5} />
            Nueva sala
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 mt-4">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => setActiveFilter(opt.key)}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-medium border transition-colors
                  ${isActive
                    ? 'bg-[var(--color-bg-brand-primary)] text-[var(--color-text-brand-primary)] border-[var(--color-border-brand)]'
                    : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)] hover:text-[var(--color-text-primary)]'
                  }
                `}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Room grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onJoin={() => setCurrentRoom(room)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-[var(--color-text-quaternary)]">
            No hay salas en esta categoría.
          </div>
        )}

        <p className="text-center text-xs text-[var(--color-text-quaternary)] mt-8">
          Las salas multiplayer interactivas llegan en Phase 4 con Phaser.js
        </p>
      </div>
    </div>
  )
}
