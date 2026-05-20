'use client'

// ZoneCard — floating contextual card de zona
//
// Reemplaza MapSidebar: ya no es un flex-sibling del mapa (que reduce el ancho
// disponible) sino un overlay absoluto dentro del TransformWrapper — el mapa
// siempre ocupa el 100% del viewport.
//
// Diseño: Discord voice channel popup / Gather room tooltip — ligero, contextual,
// rápido. Sin tabs, sin widgets, sin bloques de capacidad.
// Solo: zona, quién está, acciones directas.

import { useMemo, useRef } from 'react'
import { useUser }               from '@clerk/nextjs'
import { X, MessageCircle, Phone, Users } from 'lucide-react'
import { OfficeZone, MOCK_USERS, ZONE_OCCUPANCY } from '@/lib/mock-data'
import { useRealtimeStore }      from '@/store/realtime.store'
import { usePlayerStore }        from '@/store/player.store'
import { useInteractionStore }   from '@/store/interaction.store'
import { sendInteractionEvent }  from '@/lib/interaction-events'
import { getBlobColor }          from '@/lib/visual-system'
import { UserStatus }            from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ZoneCardProps {
  zone:    OfficeZone | null
  onClose: () => void
}

// Mapa status → dot color + label (inline — no depende de Tailwind)
const STATUS_DOT: Record<string, { color: string; label: string }> = {
  [UserStatus.AVAILABLE]:  { color: '#4ade80', label: 'Disponible'   },
  [UserStatus.BUSY]:       { color: '#f59e0b', label: 'Ocupado'      },
  [UserStatus.IN_MEETING]: { color: '#f43f5e', label: 'En reunión'   },
  [UserStatus.AWAY]:       { color: '#94a3b8', label: 'Ausente'      },
  [UserStatus.OFFLINE]:    { color: '#6b7280', label: 'Desconectado' },
}
const STATUS_DEFAULT = { color: '#6b7280', label: 'Desconectado' }

// ─── PersonRow ────────────────────────────────────────────────────────────────

interface PersonRowProps {
  userId:    string
  name:      string
  avatarUrl: string | null
  status:    UserStatus
  isLocal?:  boolean
  onMessage?: () => void
  onCall?:    () => void
}

function PersonRow({ userId, name, avatarUrl, status, isLocal, onMessage, onCall }: PersonRowProps) {
  const color    = getBlobColor(userId)
  const initials = name.trim().split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  const dot      = STATUS_DOT[status] ?? STATUS_DEFAULT
  const msgRef   = useRef<HTMLButtonElement>(null)
  const callRef  = useRef<HTMLButtonElement>(null)

  return (
    <div style={{
      display:     'flex',
      alignItems:  'center',
      gap:         10,
      padding:     '7px 12px',
      borderRadius: 10,
      transition:  'background 0.12s',
    }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)' }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width:          32,
          height:         32,
          borderRadius:   '50%',
          background:     `linear-gradient(145deg, ${color.body}, ${color.dark})`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          overflow:       'hidden',
          boxShadow:      `0 0 0 2px ${color.body}22`,
        }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 11, userSelect: 'none' }}>
              {initials}
            </span>
          )}
        </div>
        {/* Status dot */}
        <div style={{
          position:     'absolute',
          bottom:       0,
          right:        0,
          width:        9,
          height:       9,
          borderRadius: '50%',
          background:   dot.color,
          border:       '1.5px solid var(--color-bg-primary, #fff)',
        }} />
      </div>

      {/* Name + status */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin:       0,
          fontSize:     12,
          fontWeight:   isLocal ? 700 : 600,
          color:        'var(--color-text-primary, #101828)',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {name}
          {isLocal && (
            <span style={{
              marginLeft:   6,
              fontSize:     9,
              fontWeight:   700,
              color:        'var(--color-text-brand-primary, #7C3AED)',
              background:   'rgba(124,58,237,0.10)',
              padding:      '1px 5px',
              borderRadius: 4,
              verticalAlign: 'middle',
            }}>tú</span>
          )}
        </p>
        <p style={{
          margin:    0,
          fontSize:  10,
          color:     dot.color,
          fontWeight: 500,
          marginTop: 1,
        }}>
          {dot.label}
        </p>
      </div>

      {/* Acciones — solo para peers remotos reales (no NPCs ni el jugador local) */}
      {!isLocal && (onMessage || onCall) && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {/* Mensaje */}
          {onMessage && (
            <button
              ref={msgRef}
              onClick={onMessage}
              title="Mensaje directo"
              style={{
                width:          26,
                height:         26,
                borderRadius:   7,
                border:         'none',
                background:     'rgba(124,58,237,0.09)',
                color:          '#7C3AED',
                cursor:         'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                transition:     'all 0.12s',
              }}
              onMouseEnter={() => {
                if (!msgRef.current) return
                msgRef.current.style.background = 'rgba(124,58,237,0.18)'
                msgRef.current.style.transform  = 'scale(1.08)'
              }}
              onMouseLeave={() => {
                if (!msgRef.current) return
                msgRef.current.style.background = 'rgba(124,58,237,0.09)'
                msgRef.current.style.transform  = ''
              }}
            >
              <MessageCircle size={13} strokeWidth={1.75} />
            </button>
          )}

          {/* Llamar */}
          {onCall && (
            <button
              ref={callRef}
              onClick={onCall}
              title="Llamar"
              style={{
                width:          26,
                height:         26,
                borderRadius:   7,
                border:         'none',
                background:     'rgba(59,130,246,0.09)',
                color:          '#3b82f6',
                cursor:         'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                transition:     'all 0.12s',
              }}
              onMouseEnter={() => {
                if (!callRef.current) return
                callRef.current.style.background = 'rgba(59,130,246,0.18)'
                callRef.current.style.transform  = 'scale(1.08)'
              }}
              onMouseLeave={() => {
                if (!callRef.current) return
                callRef.current.style.background = 'rgba(59,130,246,0.09)'
                callRef.current.style.transform  = ''
              }}
            >
              <Phone size={13} strokeWidth={1.75} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── ZoneCard ─────────────────────────────────────────────────────────────────

export function ZoneCard({ zone, onClose }: ZoneCardProps) {
  const { user }    = useUser()
  const peers       = useRealtimeStore((s) => s.peers)
  const localZoneId = usePlayerStore((s) => s.currentZoneId)
  const localName   = usePlayerStore((s) => s.name)
  const localAvatar = usePlayerStore((s) => s.avatarUrl)
  const openChat    = useInteractionStore((s) => s.openChat)

  const localId = user?.id ?? null

  // NPCs (mock) asignados a esta zona
  const zoneNPCs = useMemo(() => {
    const ids = ZONE_OCCUPANCY[zone?.id ?? ''] ?? []
    return MOCK_USERS.filter((u) => ids.includes(u.id))
  }, [zone?.id])

  // Peers en tiempo real en esta zona
  const zonepeers = useMemo(() =>
    Object.values(peers).filter((p) => p.zoneId === zone?.id),
    [peers, zone?.id],
  )

  const localIsHere = localZoneId === zone?.id
  const totalPeople = zoneNPCs.length + zonepeers.length + (localIsHere ? 1 : 0)

  if (!zone) return null

  return (
    <div
      style={{
        position:       'absolute',
        top:            16,
        right:          16,
        width:          268,
        zIndex:         40,
        borderRadius:   16,
        background:     'var(--color-bg-primary, #fff)',
        border:         '1px solid var(--color-border-secondary, rgba(0,0,0,0.09))',
        boxShadow:      '0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(24px)',
        overflow:       'hidden',
        animation:      'zoneCardIn 0.26s cubic-bezier(0.34,1.56,0.64,1) forwards',
        pointerEvents:  'auto',
      }}
    >
      {/* Accent bar — identidad visual de la zona */}
      <div className={`h-[3px] w-full ${zone.accent}`} />

      {/* Header */}
      <div style={{
        display:    'flex',
        alignItems: 'flex-start',
        gap:        10,
        padding:    '12px 12px 10px',
      }}>
        {/* Icono de zona */}
        <div style={{
          width:          36,
          height:         36,
          borderRadius:   10,
          flexShrink:     0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       18,
          background:     'var(--color-bg-secondary, rgba(0,0,0,0.04))',
          border:         '1px solid var(--color-border-secondary, rgba(0,0,0,0.07))',
        }}>
          {zone.icon}
        </div>

        {/* Nombre + descripción */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin:        0,
            fontSize:      13,
            fontWeight:    700,
            color:         'var(--color-text-primary, #101828)',
            letterSpacing: '-0.01em',
            lineHeight:    1.2,
            overflow:      'hidden',
            textOverflow:  'ellipsis',
            whiteSpace:    'nowrap',
          }}>
            {zone.name}
          </h3>
          <p style={{
            margin:    '3px 0 0',
            fontSize:  10,
            color:     'var(--color-text-quaternary, #9CA3AF)',
            fontWeight: 500,
            overflow:  'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {zone.description}
          </p>
        </div>

        {/* Cerrar */}
        <button
          onClick={onClose}
          style={{
            flexShrink:     0,
            alignSelf:      'flex-start',
            width:          24,
            height:         24,
            borderRadius:   7,
            border:         '1px solid var(--color-border-secondary, rgba(0,0,0,0.09))',
            background:     'transparent',
            cursor:         'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            color:          'var(--color-text-quaternary, #9CA3AF)',
            transition:     'all 0.12s',
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget
            b.style.background = 'rgba(0,0,0,0.06)'
            b.style.color      = 'var(--color-text-secondary, #344054)'
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget
            b.style.background = 'transparent'
            b.style.color      = 'var(--color-text-quaternary, #9CA3AF)'
          }}
        >
          <X size={12} strokeWidth={2} />
        </button>
      </div>

      {/* Divider */}
      <div style={{
        height:  1,
        margin:  '0 12px',
        background: 'var(--color-border-secondary, rgba(0,0,0,0.06))',
      }} />

      {/* People section */}
      <div style={{ padding: '8px 0 10px' }}>

        {/* Contador */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        6,
          padding:    '0 12px 6px',
        }}>
          <Users size={11} strokeWidth={2} color="var(--color-text-quaternary, #9CA3AF)" />
          <span style={{
            fontSize:  10,
            fontWeight: 600,
            color:     'var(--color-text-quaternary, #9CA3AF)',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}>
            {totalPeople === 0
              ? 'Sin personas'
              : totalPeople === 1
              ? '1 persona'
              : `${totalPeople} personas`}
          </span>
        </div>

        {/* Lista de personas */}
        {totalPeople === 0 ? (
          <div style={{
            padding:   '16px 12px',
            textAlign: 'center',
            color:     'var(--color-text-quaternary, #9CA3AF)',
            fontSize:  11,
          }}>
            La zona está vacía
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Jugador local */}
            {localIsHere && localId && (
              <PersonRow
                userId={localId}
                name={localName || 'Tú'}
                avatarUrl={localAvatar}
                status={UserStatus.AVAILABLE}
                isLocal
              />
            )}

            {/* Peers remotos reales en esta zona — con acciones completas */}
            {zonepeers.map((peer) => (
              <PersonRow
                key={peer.userId}
                userId={peer.userId}
                name={peer.name}
                avatarUrl={peer.avatarUrl}
                status={peer.status}
                onMessage={() => openChat(peer.userId, peer.name)}
                onCall={() =>
                  sendInteractionEvent({ type: 'call_request' }, [peer.userId]).catch(console.warn)
                }
              />
            ))}

            {/* NPCs de la zona — sin acciones (son presencia simulada) */}
            {zoneNPCs.map((npc) => (
              <PersonRow
                key={npc.id}
                userId={npc.id}
                name={npc.name}
                avatarUrl={npc.avatarUrl}
                status={npc.status}
                // Sin onMessage/onCall → sin botones de acción
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
