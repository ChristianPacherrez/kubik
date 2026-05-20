'use client'

// MapSidebar — panel contextual de sala (Phase 6 — Room Activities)
//
// Arquitectura:
//   · Header: identidad de sala (icono, nombre, actividad, atmósfera)
//   · Participantes reales: jugador local + peers del realtime store
//   · Tabs: según los widgets de la sala (notes/tasks/links)
//   · Cada widget panel: CRUD + Realtime sync vía useRoomWidgets
//
// Diseño: "calm collaborative software" — sin sobrecarga visual,
// espacio para respirar, interacciones intuitivas, UX premium.

import React, { useState, useMemo, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  X, Users, FileText, CheckSquare, Link2,
  Plus, Check, ExternalLink,
} from 'lucide-react'
import { OfficeZone } from '@/lib/mock-data'
import { getRoomConfig, WidgetType } from '@/lib/room-config'
import { useRealtimeStore, PeerPresence } from '@/store/realtime.store'
import { usePlayerStore } from '@/store/player.store'
import { useRoomWidgets } from '@/hooks/useRoomWidgets'
import { useRoomSession } from '@/hooks/useRoomSession'
import { NoteColor, NOTE_COLORS, RoomNote, RoomTask, RoomLink } from '@/store/room-widgets.store'
import { UserStatus, STATUS_COLORS } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface MapSidebarProps {
  zone:    OfficeZone | null
  onClose: () => void
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function MapSidebar({ zone, onClose }: MapSidebarProps) {
  const isOpen   = zone !== null
  const config   = zone ? getRoomConfig(zone.type) : null
  const { user } = useUser()

  // Participantes reales en esta sala
  const peers         = useRealtimeStore((s) => s.peers)
  const localZoneId   = usePlayerStore((s) => s.currentZoneId)
  const localName     = usePlayerStore((s) => s.name)
  const localAvatar   = usePlayerStore((s) => s.avatarUrl)

  const realPeers = useMemo(() =>
    Object.values(peers).filter((p) => p.zoneId === zone?.id),
    [peers, zone?.id]
  )
  const localIsHere = localZoneId === zone?.id

  // Widgets del hook (fetch + realtime sync)
  const widgets = useRoomWidgets(zone?.id ?? null)

  // Sesión activa de la sala
  const sessionData = useRoomSession(zone?.id ?? null)

  // Tab activo — reset cuando cambia la sala
  const [activeTab, setActiveTab] = useState<'people' | WidgetType>('people')

  // Las tabs disponibles para esta sala
  const tabs: Array<'people' | WidgetType> = config
    ? ['people', ...config.widgets]
    : ['people']

  return (
    <div className={`
      flex-shrink-0 flex flex-col h-full
      bg-[var(--color-bg-primary)] border-l border-[var(--color-border-secondary)]
      transition-all duration-300 ease-out overflow-hidden
      ${isOpen ? 'w-[300px]' : 'w-0'}
    `}>
      {zone && config && (
        <>
          {/* ── Header ──────────────────────────────────────── */}
          <div className="flex-shrink-0 bg-[var(--color-bg-secondary)]">
            {/* Barra de acento — identidad visual de la zona */}
            <div className={`h-0.5 w-full ${zone.accent}`} />

            <div className="px-4 pt-3 pb-2">
              <div className="flex items-start justify-between gap-2">
                {/* Identidad */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="
                    w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center
                    text-lg border border-[var(--color-border-secondary)]
                    bg-[var(--color-bg-primary)]
                  ">
                    {zone.icon}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[13px] font-bold leading-tight truncate text-[var(--color-text-primary)]">
                      {zone.name}
                    </h2>
                    <p className="text-[10px] font-medium mt-0.5 text-[var(--color-text-quaternary)]">
                      {config.label}
                    </p>
                  </div>
                </div>

                {/* Cerrar */}
                <button
                  onClick={onClose}
                  className="
                    flex-shrink-0 w-6 h-6 rounded-md
                    flex items-center justify-center
                    text-[var(--color-text-quaternary)] hover:text-[var(--color-text-secondary)]
                    hover:bg-[var(--color-bg-primary_hover)] transition-all duration-100
                  "
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </div>

              {/* Atmósfera */}
              <p className="text-[10px] text-[var(--color-text-quaternary)] leading-relaxed mt-2 mb-1">
                {config.atmosphere}
              </p>

              {/* Ocupación */}
              <OccupancyBar
                current={realPeers.length + (localIsHere ? 1 : 0)}
                max={zone.maxCapacity}
              />
            </div>

            {/* Reglas de la sala (si las hay) */}
            {config.rules && config.rules.length > 0 && (
              <div className="mx-4 mb-2 px-2.5 py-1.5 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {config.rules.map((rule) => (
                    <span key={rule} className="text-[9px] font-medium text-[var(--color-text-quaternary)]">
                      · {rule}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Session Banner ──────────────────────────────── */}
          <SessionBanner
            zone={zone}
            config={config}
            sessionData={sessionData}
          />

          {/* ── Tab nav ─────────────────────────────────────── */}
          <div className="flex-shrink-0 flex border-b border-[var(--color-border-secondary)] px-2 pt-1">
            {tabs.map((tab) => (
              <TabButton
                key={tab}
                tab={tab}
                active={activeTab === tab}
                count={getTabCount(tab, realPeers.length + (localIsHere ? 1 : 0), widgets)}
                onClick={() => setActiveTab(tab)}
              />
            ))}
          </div>

          {/* ── Contenido ────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'people' && (
              <PeoplePanel
                zone={zone}
                localIsHere={localIsHere}
                localName={localName}
                localAvatar={localAvatar}
                realPeers={realPeers}
                userId={user?.id}
              />
            )}
            {activeTab === 'notes' && (
              <NotesPanel
                notes={widgets.notes}
                loading={widgets.loading}
                onAdd={widgets.addNote}
                onRemove={widgets.removeNote}
                userId={user?.id}
              />
            )}
            {activeTab === 'tasks' && (
              <TasksPanel
                tasks={widgets.tasks}
                loading={widgets.loading}
                onAdd={widgets.addTask}
                onToggle={widgets.toggleTask}
                onRemove={widgets.removeTask}
                userId={user?.id}
              />
            )}
            {activeTab === 'links' && (
              <LinksPanel
                links={widgets.links}
                loading={widgets.loading}
                onAdd={widgets.addLink}
                onRemove={widgets.removeLink}
                userId={user?.id}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTabCount(
  tab: 'people' | WidgetType,
  peopleCount: number,
  w: ReturnType<typeof useRoomWidgets>
): number | null {
  if (tab === 'people') return peopleCount > 0 ? peopleCount : null
  if (tab === 'notes')  return w.notes.length  > 0 ? w.notes.length  : null
  if (tab === 'tasks')  return w.tasks.length  > 0 ? w.tasks.length  : null
  if (tab === 'links')  return w.links.length  > 0 ? w.links.length  : null
  return null
}

// Lucide icon per tab
const TAB_ICONS: Record<string, React.ElementType> = {
  people: Users,
  notes:  FileText,
  tasks:  CheckSquare,
  links:  Link2,
}

const TAB_LABELS: Record<string, string> = {
  people: 'Personas',
  notes:  'Notas',
  tasks:  'Tareas',
  links:  'Links',
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function OccupancyBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min(Math.round((current / max) * 100), 100)
  // Semántico: verde <60%, ámbar 60-85%, rojo >85%
  const fillColor = pct > 85 ? 'bg-rose-400' : pct > 60 ? 'bg-amber-400' : 'bg-emerald-400'

  return (
    <div className="mt-1.5 mb-0.5">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] text-[var(--color-fg-quaternary)]">Capacidad</span>
        <span className="text-[9px] font-semibold text-[var(--color-text-primary)]">{current}/{max}</span>
      </div>
      <div className="h-1 bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${fillColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function TabButton({
  tab, active, count, onClick,
}: {
  tab: 'people' | WidgetType
  active: boolean
  count: number | null
  onClick: () => void
}) {
  const label = TAB_LABELS[tab] ?? tab
  const Icon  = TAB_ICONS[tab]
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-1.5 px-2.5 py-2 text-[10px] font-medium
        transition-colors duration-150 border-b-2 -mb-px
        ${active
          ? 'text-[var(--color-text-brand-primary)] border-[var(--color-border-brand)]'
          : 'text-[var(--color-text-quaternary)] border-transparent hover:text-[var(--color-text-tertiary)]'
        }
      `}
    >
      {Icon && <Icon size={11} strokeWidth={1.8} />}
      <span>{label}</span>
      {count !== null && (
        <span className={`
          px-1 rounded text-[8px] font-bold
          ${active
            ? 'bg-[var(--color-bg-brand-primary)] text-[var(--color-text-brand-primary)]'
            : 'bg-[var(--color-bg-primary)] text-[var(--color-fg-quaternary)]'
          }
        `}>
          {count}
        </span>
      )}
    </button>
  )
}

// ─── People Panel ─────────────────────────────────────────────────────────────

function PeoplePanel({
  zone, localIsHere, localName, localAvatar, realPeers, userId,
}: {
  zone: OfficeZone
  localIsHere: boolean
  localName: string
  localAvatar: string | null
  realPeers: PeerPresence[]
  userId?: string
}) {
  const hasAnyone = localIsHere || realPeers.length > 0

  return (
    <div className="p-3 flex flex-col gap-1">
      {/* Jugador local */}
      {localIsHere && (
        <PersonRow
          name={`${localName} (tú)`}
          avatarUrl={localAvatar}
          status={UserStatus.AVAILABLE}
          isLocal
        />
      )}

      {/* Peers remotos en esta sala */}
      {realPeers.map((peer) => (
        <PersonRow
          key={peer.userId}
          name={peer.name}
          avatarUrl={peer.avatarUrl}
          status={peer.status}
        />
      ))}

      {/* Estado vacío */}
      {!hasAnyone && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Users size={28} strokeWidth={1.2} className="text-[var(--color-border-primary)]" />
          <p className="text-[11px] text-[var(--color-fg-quaternary)]">Sala vacía</p>
          <p className="text-[10px] text-[var(--color-fg-quaternary)]">Entra con WASD para ser el primero</p>
        </div>
      )}
    </div>
  )
}

function PersonRow({
  name, avatarUrl, status, isLocal,
}: {
  name: string
  avatarUrl: string | null
  status: UserStatus
  isLocal?: boolean
}) {
  const initials  = name.trim().split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  const dotColor  = STATUS_COLORS[status]
  const avatarBg  = isLocal ? 'bg-[var(--color-bg-brand-solid)]' : 'bg-[var(--color-border-secondary)]'

  return (
    <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[var(--color-bg-primary)] transition-colors duration-100">
      {/* Avatar */}
      <div className={`
        relative w-7 h-7 rounded-full flex-shrink-0
        flex items-center justify-center text-[9px] font-bold text-white
        ${avatarBg}
      `}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" />
        ) : (
          initials
        )}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--color-bg-primary)] ${dotColor}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-medium truncate ${isLocal ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
          {name}
        </p>
      </div>

      {isLocal && (
        <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-bg-brand-primary)] text-[var(--color-text-brand-primary)]">
          Tú
        </span>
      )}
    </div>
  )
}

// ─── Notes Panel ──────────────────────────────────────────────────────────────

const NOTE_COLOR_LIST: NoteColor[] = ['yellow', 'blue', 'green', 'pink', 'purple']

function NotesPanel({
  notes, loading, onAdd, onRemove, userId,
}: {
  notes: RoomNote[]
  loading: boolean
  onAdd: (content: string, color?: NoteColor) => void
  onRemove: (id: string) => void
  userId?: string
}) {
  const [text, setText]   = useState('')
  const [color, setColor] = useState<NoteColor>('yellow')

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(trimmed, color)
    setText('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Input */}
      <div className="p-3 border-b border-[var(--color-border-secondary)] flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
          }}
          placeholder="Escribe una nota... (⌘↵ para guardar)"
          className="
            w-full resize-none bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]
            rounded-lg px-3 py-2 text-[11px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-fg-quaternary)]
            focus:outline-none focus:border-[var(--color-border-primary)]
            transition-colors duration-150
          "
          rows={3}
        />
        <div className="flex items-center justify-between">
          {/* Paleta de colores */}
          <div className="flex gap-1">
            {NOTE_COLOR_LIST.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-4 h-4 rounded-full transition-all duration-100 ${NOTE_COLORS[c].bg} border ${NOTE_COLORS[c].border} ${color === c ? 'ring-2 ring-white/30 scale-110' : 'opacity-60 hover:opacity-100'}`}
              />
            ))}
          </div>
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="
              px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white
              bg-[var(--color-bg-brand-solid)] hover:bg-[var(--color-bg-brand-solid_hover)]
              transition-all duration-150 disabled:opacity-30
            "
          >
            Añadir
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {loading && <LoadingSkeleton rows={2} />}

        {!loading && notes.length === 0 && (
          <EmptyState
            icon={<FileText size={28} strokeWidth={1.2} className="text-[var(--color-border-primary)]" />}
            title="Sin notas aún"
            subtitle="Añade la primera nota para esta sala"
          />
        )}

        {notes.map((note) => {
          const colors = NOTE_COLORS[note.color] ?? NOTE_COLORS.yellow
          return (
            <div
              key={note.id}
              className={`p-3 rounded-xl border ${colors.bg} ${colors.border} group relative`}
            >
              <p className={`text-[11px] leading-relaxed whitespace-pre-wrap ${colors.text}`}>
                {note.content}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] text-[var(--color-fg-quaternary)]">{note.author_name.split(' ')[0]}</span>
                {note.author_id === userId && (
                  <button
                    onClick={() => onRemove(note.id)}
                    className="text-[9px] text-[var(--color-fg-quaternary)] hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    eliminar
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tasks Panel ──────────────────────────────────────────────────────────────

function TasksPanel({
  tasks, loading, onAdd, onToggle, onRemove, userId,
}: {
  tasks: RoomTask[]
  loading: boolean
  onAdd: (text: string) => void
  onToggle: (id: string, done: boolean) => void
  onRemove: (id: string) => void
  userId?: string
}) {
  const [text, setText] = useState('')

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setText('')
  }

  const done    = tasks.filter((t) => t.done)
  const pending = tasks.filter((t) => !t.done)

  return (
    <div className="flex flex-col h-full">
      {/* Input */}
      <div className="p-3 border-b border-[var(--color-border-secondary)] flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Nueva tarea..."
          className="
            flex-1 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]
            rounded-lg px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-fg-quaternary)]
            focus:outline-none focus:border-[var(--color-border-primary)]
            transition-colors duration-150
          "
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="
            px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white
            bg-[var(--color-bg-brand-solid)] hover:bg-[var(--color-bg-brand-solid_hover)]
            transition-all duration-150 disabled:opacity-30
            flex items-center justify-center
          "
        >
          <Plus size={12} strokeWidth={2.5} />
        </button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
        {loading && <LoadingSkeleton rows={3} />}

        {!loading && tasks.length === 0 && (
          <EmptyState
            icon={<CheckSquare size={28} strokeWidth={1.2} className="text-[var(--color-border-primary)]" />}
            title="Sin tareas"
            subtitle="Añade tareas para esta sesión"
          />
        )}

        {pending.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            userId={userId}
            onToggle={onToggle}
            onRemove={onRemove}
          />
        ))}

        {done.length > 0 && (
          <>
            <div className="text-[9px] text-[var(--color-fg-quaternary)] font-semibold uppercase tracking-widest mt-3 mb-1 px-1">
              Completadas · {done.length}
            </div>
            {done.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                userId={userId}
                onToggle={onToggle}
                onRemove={onRemove}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function TaskRow({
  task, userId, onToggle, onRemove,
}: {
  task: RoomTask
  userId?: string
  onToggle: (id: string, done: boolean) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-[var(--color-bg-primary)] group transition-colors duration-100">
      <button
        onClick={() => onToggle(task.id, !task.done)}
        className={`
          flex-shrink-0 w-4 h-4 rounded border transition-all duration-150
          flex items-center justify-center
          ${task.done
            ? 'bg-[var(--color-bg-brand-solid)] border-transparent'
            : 'border-[var(--color-border-primary)] bg-transparent hover:border-[var(--color-text-tertiary)]'
          }
        `}
      >
        {task.done && <Check size={9} strokeWidth={3} className="text-white" />}
      </button>

      <span className={`flex-1 text-[11px] leading-tight transition-all ${task.done ? 'line-through text-[var(--color-fg-quaternary)]' : 'text-[var(--color-text-secondary)]'}`}>
        {task.text}
      </span>

      {task.author_id === userId && (
        <button
          onClick={() => onRemove(task.id)}
          className="text-[var(--color-fg-quaternary)] hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          <X size={10} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

// ─── Links Panel ──────────────────────────────────────────────────────────────

function LinksPanel({
  links, loading, onAdd, onRemove, userId,
}: {
  links: RoomLink[]
  loading: boolean
  onAdd: (url: string, title: string) => void
  onRemove: (id: string) => void
  userId?: string
}) {
  const [url, setUrl]     = useState('')
  const [title, setTitle] = useState('')

  const submit = () => {
    const u = url.trim()
    const t = title.trim() || u
    if (!u) return
    onAdd(u.startsWith('http') ? u : `https://${u}`, t)
    setUrl('')
    setTitle('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Input */}
      <div className="p-3 border-b border-[var(--color-border-secondary)] flex flex-col gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="https://..."
          className="
            w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]
            rounded-lg px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-fg-quaternary)]
            focus:outline-none focus:border-[var(--color-border-primary)] transition-colors
          "
        />
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Título (opcional)"
            className="
              flex-1 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]
              rounded-lg px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-fg-quaternary)]
              focus:outline-none focus:border-[var(--color-border-primary)] transition-colors
            "
          />
          <button
            onClick={submit}
            disabled={!url.trim()}
            className="
              px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white
              bg-[var(--color-bg-brand-solid)] hover:bg-[var(--color-bg-brand-solid_hover)]
              transition-all disabled:opacity-30
            "
          >
            Añadir
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
        {loading && <LoadingSkeleton rows={2} />}

        {!loading && links.length === 0 && (
          <EmptyState
            icon={<Link2 size={28} strokeWidth={1.2} className="text-[var(--color-border-primary)]" />}
            title="Sin links"
            subtitle="Comparte recursos con el equipo"
          />
        )}

        {links.map((link) => (
          <div
            key={link.id}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)] group transition-colors duration-100"
          >
            {/* Favicon */}
            <div className="flex-shrink-0 w-6 h-6 rounded-md bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden border border-[var(--color-border-secondary)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${new URL(link.url.startsWith('http') ? link.url : `https://${link.url}`).hostname}&sz=32`}
                alt=""
                className="w-4 h-4"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium truncate flex items-center gap-1 hover:underline text-[var(--color-text-brand-primary)]"
              >
                <span className="truncate">{link.title}</span>
                <ExternalLink size={9} strokeWidth={2} className="flex-shrink-0 opacity-60" />
              </a>
              <p className="text-[9px] text-[var(--color-fg-quaternary)] truncate">{link.author_name.split(' ')[0]}</p>
            </div>

            {link.author_id === userId && (
              <button
                onClick={() => onRemove(link.id)}
                className="text-[var(--color-fg-quaternary)] hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                <X size={10} strokeWidth={2} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Utility components ───────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-10 text-center">
      <div className="opacity-40">{icon}</div>
      <p className="text-[11px] text-[var(--color-text-quaternary)] font-medium">{title}</p>
      <p className="text-[10px] text-[var(--color-fg-quaternary)]">{subtitle}</p>
    </div>
  )
}

function LoadingSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-[var(--color-bg-secondary)] animate-pulse" />
      ))}
    </div>
  )
}

// ─── useElapsedTime ───────────────────────────────────────────────────────────

function useElapsedTime(startedAt: string | null): string {
  const [label, setLabel] = useState('Ahora')

  useEffect(() => {
    if (!startedAt) return

    const update = () => {
      const diff  = Date.now() - new Date(startedAt).getTime()
      const mins  = Math.floor(diff / 60_000)
      const hours = Math.floor(mins / 60)
      if (hours > 0)       setLabel(`${hours}h ${mins % 60}m`)
      else if (mins >= 1)  setLabel(`${mins} min`)
      else                 setLabel('Ahora')
    }

    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [startedAt])

  return label
}

// ─── SessionBanner ────────────────────────────────────────────────────────────
//
// Se renderiza entre el header y los tabs del sidebar.
// · Sin sesión: botón sutil "Iniciar sesión" con form inline
// · Con sesión: card LIVE con título, duración, participantes, join/leave

function SessionBanner({
  zone,
  config,
  sessionData,
}: {
  zone:        OfficeZone
  config:      ReturnType<typeof getRoomConfig> | null
  sessionData: ReturnType<typeof useRoomSession>
}) {
  const { session, participants, isParticipant, isStarter, startSession, endSession, joinSession, leaveSession } = sessionData
  const elapsed = useElapsedTime(session?.started_at ?? null)

  // Form de nueva sesión
  const [starting, setStarting] = useState(false)
  const [title, setTitle]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleStart = async () => {
    if (!title.trim() && !config) return
    setLoading(true)
    await startSession(title.trim() || 'Sesión activa')
    setLoading(false)
    setStarting(false)
    setTitle('')
  }

  // ── Sin sesión ──────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="px-4 py-2 border-b border-[var(--color-border-secondary)]">
        {!starting ? (
          <button
            onClick={() => setStarting(true)}
            className="
              w-full flex items-center justify-center gap-1.5
              py-1.5 rounded-lg text-[10px] font-medium
              text-[var(--color-text-quaternary)] hover:text-[var(--color-text-secondary)]
              border border-dashed border-[var(--color-border-secondary)]
              hover:border-[var(--color-border-primary)]
              transition-all duration-150
            "
          >
            <Plus size={11} strokeWidth={2} />
            Iniciar sesión
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleStart(); if (e.key === 'Escape') setStarting(false) }}
              placeholder={config?.statusOptions[0] ?? 'Sesión activa'}
              className="
                w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]
                rounded-lg px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-fg-quaternary)]
                focus:outline-none focus:border-[var(--color-border-primary)] transition-colors
              "
            />
            {/* Quick-picks del tipo de sala */}
            {config && (
              <div className="flex flex-wrap gap-1">
                {config.statusOptions.slice(0, 3).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setTitle(opt)}
                    className={`
                      text-[9px] px-1.5 py-0.5 rounded-md border transition-all
                      ${title === opt
                        ? 'border-[var(--color-border-brand)] bg-[var(--color-bg-brand-primary)] text-[var(--color-text-brand-primary)]'
                        : 'border-[var(--color-border-secondary)] text-[var(--color-fg-quaternary)] hover:text-[var(--color-text-tertiary)]'
                      }
                    `}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setStarting(false)}
                className="flex-1 py-1 rounded-lg text-[10px] text-[var(--color-text-quaternary)] hover:text-[var(--color-text-secondary)] border border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleStart}
                disabled={loading}
                className="
                  flex-1 py-1 rounded-lg text-[10px] font-semibold text-white
                  bg-[var(--color-bg-brand-solid)] hover:bg-[var(--color-bg-brand-solid_hover)]
                  transition-all disabled:opacity-50
                "
              >
                {loading ? '...' : 'Iniciar'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Con sesión activa ───────────────────────────────────────────────────────
  return (
    <div className="px-3 py-2.5 border-b border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)]">
      {/* Header de sesión */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Dot LIVE pulsante */}
          <span
            className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0"
            style={{ animation: 'subtlePulse 1s ease-in-out infinite' }}
          />
          <span className="text-[10px] font-bold text-rose-400 tracking-widest">LIVE</span>
        </div>
        <span className="text-[9px] text-[var(--color-fg-quaternary)] flex-shrink-0">{elapsed}</span>
      </div>

      {/* Título */}
      <p className="text-[12px] font-semibold leading-tight truncate text-[var(--color-text-primary)] mb-1">
        {session.title}
      </p>

      {/* Iniciada por */}
      <p className="text-[9px] text-[var(--color-fg-quaternary)] mb-2">
        Iniciada por {session.started_name.split(' ')[0]}
      </p>

      {/* Participantes mini-avatares */}
      {participants.length > 0 && (
        <div className="flex items-center gap-1 mb-2.5">
          {participants.slice(0, 6).map((p) => {
            const initials = p.user_name.trim().split(' ').slice(0, 2).map((x) => x[0]).join('').toUpperCase()
            const colors   = ['bg-indigo-500','bg-emerald-500','bg-violet-500','bg-amber-500','bg-sky-500']
            const bg       = colors[p.user_name.charCodeAt(0) % colors.length]
            return (
              <div
                key={p.user_id}
                title={p.user_name}
                className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-[var(--color-bg-secondary)] ${bg}`}
              >
                {p.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.avatar_url} alt={p.user_name} className="w-full h-full rounded-full object-cover" />
                  : initials
                }
              </div>
            )
          })}
          {participants.length > 6 && (
            <span className="text-[9px] text-[var(--color-fg-quaternary)]">+{participants.length - 6}</span>
          )}
          <span className="text-[9px] text-[var(--color-fg-quaternary)] ml-1">
            {participants.length === 1 ? '1 participante' : `${participants.length} participantes`}
          </span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-1.5">
        {!isParticipant ? (
          <button
            onClick={joinSession}
            className="
              flex-1 py-1.5 rounded-lg text-[10px] font-semibold text-white
              bg-[var(--color-bg-brand-solid)] hover:bg-[var(--color-bg-brand-solid_hover)]
              transition-all duration-150
            "
          >
            Unirse a la sesión
          </button>
        ) : (
          <button
            onClick={leaveSession}
            className="
              flex-1 py-1.5 rounded-lg text-[10px] font-medium
              bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]
              text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-primary)]
              transition-all duration-150
            "
          >
            Salir de sesión
          </button>
        )}

        {isStarter && (
          <button
            onClick={endSession}
            className="
              px-2.5 py-1.5 rounded-lg text-[10px] font-medium
              text-rose-400 hover:text-rose-300
              bg-rose-500/10 hover:bg-rose-500/15
              border border-rose-500/20
              transition-all duration-150
            "
            title="Terminar sesión"
          >
            Terminar
          </button>
        )}
      </div>
    </div>
  )
}
