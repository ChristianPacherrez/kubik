'use client'

// RoomNode — tarjeta de sala con Live Sessions (Phase 6)
//
// Nuevo en Phase 6:
//   · Badge "● LIVE" cuando hay una sesión activa en la sala
//   · Strip de participantes de la sesión (mini-avatares reales)
//   · Anillo exterior más pronunciado durante sesión activa
//   · Glow más intenso en salas con sesión

import { User } from '@/types'
import { RoomLayout } from '@/lib/map-layout'
import { OfficeZone } from '@/lib/mock-data'
import { computeRoomState, ZONE_GLOW_KEYFRAME, ROOM_STATE_LABELS, ROOM_STATE_COLOR } from '@/lib/presence'
import { MOCK_USERS } from '@/lib/mock-data'
import { useSessionsStore } from '@/store/sessions.store'
import { UserPresenceDot } from './UserPresenceDot'
import { RoomFurniture }   from './RoomFurniture'
import { RoomAtmosphere } from './RoomAtmosphere'

interface RoomNodeProps {
  layout:     RoomLayout
  zone:       OfficeZone
  users:      User[]
  isSelected: boolean
  onClick:    () => void
}

export function RoomNode({ layout, zone, users, isSelected, onClick }: RoomNodeProps) {
  const occupancy   = users.length
  const capacity    = zone.maxCapacity
  const fillPercent = Math.round((occupancy / capacity) * 100)
  const isEmpty     = occupancy === 0

  // Estado derivado de ocupantes (mock)
  const roomState    = computeRoomState(zone.id, MOCK_USERS)
  const glowKeyframe = ZONE_GLOW_KEYFRAME[zone.id]
  const isMeeting    = roomState === 'meeting'

  // ── Sesión activa ──────────────────────────────────────────────────────────
  const session = useSessionsStore((s) => s.sessions[zone.id] ?? null)
  const sessionParticipants = useSessionsStore((s) =>
    session ? (s.participants[session.id] ?? []) : []
  )
  const hasSession        = session !== null
  const participantCount  = sessionParticipants.length
  const visibleSParticip  = sessionParticipants.slice(0, 4)
  const spOverflow        = sessionParticipants.length - visibleSParticip.length

  // Glow más rápido e intenso cuando hay sesión activa
  const glowDuration = hasSession ? '1.4s' : isMeeting ? '1.8s' : '3.2s'

  const visibleUsers = users.slice(0, 5)
  const overflow     = users.length - visibleUsers.length

  return (
    <div
      style={{
        position:  'absolute',
        left:      layout.x,
        top:       layout.y,
        width:     layout.width,
        height:    layout.height,
        animation: (!isEmpty || hasSession) && glowKeyframe
          ? `${glowKeyframe} ${glowDuration} ease-in-out infinite`
          : undefined,
      }}
      onClick={onClick}
      className={`
        room-node group flex flex-col
        rounded-xl overflow-hidden
        border transition-all duration-200 cursor-pointer
        ${isSelected
          ? `${zone.borderClass} ${zone.bgClass} shadow-lg`
          : isEmpty && !hasSession
            ? 'border-[var(--color-border-secondary)]/50 bg-[var(--color-bg-primary)]/35 hover:bg-[var(--color-bg-primary)]/55 hover:border-[var(--color-border-secondary)]'
            : hasSession
              ? `${zone.borderClass} bg-[var(--color-bg-primary)]/70 shadow-md`
              : 'border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]/60 hover:border-[var(--color-border-primary)] hover:bg-[var(--color-bg-primary)]/80 hover:shadow-md'
        }
      `}
    >
      {/* ── Furniture backdrop (capa decorativa, detrás de todo) ── */}
      <div
        className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-xl"
        style={{ zIndex: 0 }}
        aria-hidden
      >
        <RoomFurniture
          id={zone.id}
          width={layout.width}
          height={layout.height}
          isEmpty={isEmpty && !hasSession}
        />
      </div>

      {/* ── Atmosphere — breathing ambient glow (encima del furniture) ── */}
      <RoomAtmosphere roomId={zone.id} isLive={hasSession} />

      {/* ── Anillo de reunión activa ────────────────────────── */}
      {isMeeting && !isSelected && !hasSession && (
        <div
          className="absolute inset-0 rounded-xl border-2 border-rose-400/50 pointer-events-none"
          style={{ animation: 'meetingRingPulse 2s ease-out infinite' }}
        />
      )}

      {/* ── Anillo de sesión activa (más pronunciado) ─────── */}
      {hasSession && !isSelected && (
        <div
          className={`absolute inset-0 rounded-xl border-2 ${zone.borderClass} pointer-events-none opacity-70`}
          style={{ animation: 'meetingRingPulse 1.5s ease-out infinite' }}
        />
      )}

      {/* ── Barra de acento ───────────────────────────────── */}
      <div
        className={`
          relative w-full flex-shrink-0 ${zone.accent} transition-all duration-200
          ${isEmpty && !hasSession ? 'h-0.5 opacity-40' : isSelected || hasSession ? 'h-1.5' : 'h-1 group-hover:h-1.5'}
        `}
        style={{ zIndex: 1 }}
      />

      {/* ── Cuerpo ────────────────────────────────────────── */}
      <div
        className={`relative flex-1 flex flex-col p-4 min-h-0 ${isEmpty && !hasSession ? 'opacity-60' : ''}`}
        style={{ zIndex: 1 }}
      >

        {/* Cabecera */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`text-2xl leading-none flex-shrink-0 ${isEmpty && !hasSession ? 'grayscale opacity-60' : ''}`}>
              {zone.icon}
            </span>
            <div className="min-w-0">
              <h3 className={`text-sm font-semibold leading-tight truncate
                ${isSelected ? zone.textClass : isEmpty && !hasSession ? 'text-[var(--color-text-quaternary)]' : 'text-[var(--color-text-primary)]'}
              `}>
                {zone.name}
              </h3>
              {/* Título de sesión activa en lugar de descripción */}
              {hasSession ? (
                <p className={`text-[10px] truncate mt-0.5 leading-tight font-medium ${zone.labelClass}`}>
                  {session!.title}
                </p>
              ) : (
                <p className="text-[10px] text-[var(--color-fg-quaternary)] truncate mt-0.5 leading-tight">
                  {zone.description}
                </p>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {/* Badge LIVE — tiene prioridad sobre ocupación */}
            {hasSession ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/25">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0"
                  style={{ animation: 'subtlePulse 1s ease-in-out infinite' }}
                />
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 tracking-wide">
                  LIVE{participantCount > 0 ? ` · ${participantCount}` : ''}
                </span>
              </div>
            ) : (
              <div className={`
                flex items-center gap-1 px-2 py-0.5 rounded-full
                text-[10px] font-semibold
                ${isEmpty
                  ? 'bg-[var(--color-bg-secondary)] text-[var(--color-fg-quaternary)]'
                  : isSelected
                    ? `${zone.bgClass} ${zone.labelClass}`
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-quaternary)]'
                }
              `}>
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isEmpty ? 'bg-[var(--color-border-primary)]' : zone.dotClass}`}
                  style={!isEmpty ? { animation: 'subtlePulse 2.5s ease-in-out infinite' } : undefined}
                />
                {occupancy}/{capacity}
              </div>
            )}

            {/* Room state chip */}
            {!isEmpty && !hasSession && (
              <span className={`text-[9px] font-semibold ${ROOM_STATE_COLOR[roomState]}`}>
                {ROOM_STATE_LABELS[roomState]}
              </span>
            )}
          </div>
        </div>

        {/* ── Participantes de sesión (si hay sesión activa) ─ */}
        {hasSession && sessionParticipants.length > 0 && (
          <div className="mb-2.5 flex items-center gap-1">
            {visibleSParticip.map((p) => (
              <SessionParticipantDot key={p.user_id} name={p.user_name} avatarUrl={p.avatar_url} />
            ))}
            {spOverflow > 0 && (
              <span className="
                w-5 h-5 rounded-full bg-[var(--color-bg-secondary)]
                flex items-center justify-center
                text-[7px] font-bold text-[var(--color-text-quaternary)]
                ring-1 ring-black/20
              ">+{spOverflow}</span>
            )}
          </div>
        )}

        {/* ── Avatares de ocupantes (mock) ─────────────────── */}
        <div className="flex-1 flex items-end">
          {occupancy > 0 ? (
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-1">
                {visibleUsers.map((u) => (
                  <UserPresenceDot key={u.id} user={u} size="xs" />
                ))}
                {overflow > 0 && (
                  <span className="w-6 h-6 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-[8px] font-semibold text-[var(--color-text-quaternary)] ring-1 ring-black/20">
                    +{overflow}
                  </span>
                )}
                <span className="ml-1.5 text-[10px] text-[var(--color-fg-quaternary)] truncate">
                  {occupancy === 1 ? '1 persona' : `${occupancy} personas`}
                </span>
              </div>
              <div className="w-full h-1 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${zone.dotClass}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[var(--color-fg-quaternary)]">
              {hasSession ? (
                <span className={`text-[10px] ${zone.labelClass} opacity-70`}>
                  Sesión sin participantes aún
                </span>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  <span className="text-[10px]">Sala vacía</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Indicador de selección ────────────────────────── */}
      {isSelected && (
        <div className={`absolute bottom-3 right-3 w-5 h-5 rounded-full ${zone.dotClass} flex items-center justify-center shadow-sm`}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </div>
  )
}

// ─── Mini-avatar de participante de sesión ────────────────────────────────────

function SessionParticipantDot({
  name, avatarUrl,
}: {
  name: string
  avatarUrl: string | null
}) {
  const initials = name.trim().split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  const bg = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-sky-500']
  const color = bg[name.charCodeAt(0) % bg.length]

  return (
    <div className={`
      w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center
      text-[7px] font-bold text-white
      ring-1 ring-[var(--color-bg-primary)]
      ${color}
    `}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}
