'use client'

// InteractiveMap — contenedor principal del mapa de oficina virtual (Fase 3)
//
// Integra:
//   · Pan/zoom via react-zoom-pan-pinch (Fase 2)
//   · Movimiento del jugador WASD/arrows (Fase 3)
//   · NPCs falsos posicionados en sus salas (Fase 3)
//   · Seguimiento de cámara suave (Fase 3)
//   · Detección de zona → sidebar automático (Fase 3)
//
// Arquitectura del árbol de componentes:
//
//   InteractiveMap
//     useMovement()           ← loop de input/movimiento (rAF, sin DOM)
//     div.map-area (ref)      ← viewport del mapa, containerRef para CameraController
//       TransformWrapper      ← Context.Provider de react-zoom-pan-pinch
//         TransformComponent  ← aplica CSS transform al canvas
//           canvas 1200×700
//             FloorPlanSVG
//             RoomNodes (z:10)
//             NPCAvatar × N  (z:22)
//             PlayerAvatar   (z:25)
//         CameraController    ← rAF lerp, null DOM (debe estar dentro del Wrapper)
//         StatusLegend overlay
//         MapControls overlay
//     MapSidebar              ← flex sibling, no se transforma

import { useRef, useEffect } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { useUser } from '@clerk/nextjs'

import { useOfficeStore }   from '@/store/office.store'
import { usePlayerStore }   from '@/store/player.store'
import { useRealtimeStore } from '@/store/realtime.store'
import { useMovement }            from '@/hooks/useMovement'
import { useRealtimePresence }    from '@/hooks/useRealtimePresence'
import { useSessionsSync }        from '@/hooks/useSessionsSync'
import { OFFICE_ZONES, ZONE_OCCUPANCY, MOCK_USERS } from '@/lib/mock-data'
import { ROOM_LAYOUTS, MAP_WIDTH, MAP_HEIGHT }      from '@/lib/map-layout'

import { FloorPlanSVG }        from './FloorPlanSVG'
import { RoomNode }            from './RoomNode'
import { MapSidebar }          from './MapSidebar'
import { MapControls }         from './MapControls'
import { PlayerAvatar }        from './PlayerAvatar'
import { NPCAvatar }           from './NPCAvatar'
import { PeerAvatar }          from './PeerAvatar'
import { CameraController }    from './CameraController'
import { ProximityToast }      from './ProximityToast'
import { WorkModePicker }      from './WorkModePicker'
import { ProximityPanel }      from './ProximityPanel'

export function InteractiveMap() {
  const { selectedZoneId, setSelectedZone } = useOfficeStore()
  const initPlayer = usePlayerStore((s) => s.init)
  const peers      = useRealtimeStore((s) => s.peers)

  // Clerk: inicializar nombre y avatar del jugador en el store
  const { user } = useUser()
  useEffect(() => {
    if (user) {
      const name      = user.fullName ?? user.username ?? 'Tú'
      const avatarUrl = user.imageUrl ?? null
      initPlayer(name, avatarUrl)
    }
  }, [user, initPlayer])

  // ── Motor de movimiento ─────────────────────────────────
  // Un único hook — inicia el loop rAF y los listeners de teclado
  useMovement()

  // ── Realtime multiplayer ────────────────────────────────
  // Conecta Supabase Presence + Broadcast para ver otros jugadores
  useRealtimePresence()

  // ── Live Room Sessions ──────────────────────────────────
  // Suscripción global a sesiones de todas las salas
  useSessionsSync()

  // ── Cursor grab/grabbing ────────────────────────────────
  // Estado gestionado con callbacks (panStart/Stop) — no por frame
  const isGrabbingRef = useRef(false)
  const mapAreaRef    = useRef<HTMLDivElement>(null) // containerRef para CameraController

  // ── Sidebar ─────────────────────────────────────────────
  const selectedZone = selectedZoneId
    ? OFFICE_ZONES.find((z) => z.id === selectedZoneId) ?? null
    : null
  // NPCs: todos los usuarios mock con posición asignada
  const allNPCs = MOCK_USERS // NPCAvatar filtra internamente si no hay posición

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-primary)] theme-transition">

      {/* ── Fila principal: canvas + sidebar ─────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Área del mapa */}
        <div
          ref={mapAreaRef}
          className="flex-1 overflow-hidden relative"
        >
          {/* Vignette — profundidad y enfoque en el canvas */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-10"
            style={{ boxShadow: 'inset 0 0 120px rgba(0,0,0,0.42)' }}
          />
          <TransformWrapper
            initialScale={1}
            minScale={0.25}
            maxScale={3}
            centerOnInit
            limitToBounds={false}
            smooth
            wheel={{ step: 0.08 }}
            panning={{
              velocityDisabled: false,
              excluded: ['room-node'],
            }}
            doubleClick={{ mode: 'zoomIn', step: 0.5 }}
            onPanningStart={() => {
              isGrabbingRef.current = true
              mapAreaRef.current?.classList.add('cursor-grabbing')
              mapAreaRef.current?.classList.remove('cursor-grab')
            }}
            onPanningStop={() => {
              isGrabbingRef.current = false
              mapAreaRef.current?.classList.remove('cursor-grabbing')
              mapAreaRef.current?.classList.add('cursor-grab')
            }}
          >
            {/* ── Canvas del plano ───────────────────────── */}
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              wrapperClass="select-none cursor-grab"
            >
              <div
                className="relative"
                style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
              >
                {/* Fondo SVG del plano */}
                <FloorPlanSVG />

                {/* Capa de deselección (click en área vacía) */}
                {selectedZoneId && (
                  <div
                    className="absolute inset-0 z-0"
                    onClick={() => setSelectedZone(null)}
                  />
                )}

                {/* Salas interactivas */}
                {ROOM_LAYOUTS.map((layout) => {
                  const zone = OFFICE_ZONES.find((z) => z.id === layout.id)
                  if (!zone) return null
                  const users = (ZONE_OCCUPANCY[layout.id] ?? [])
                    .map((uid) => MOCK_USERS.find((u) => u.id === uid))
                    .filter(Boolean) as typeof MOCK_USERS
                  return (
                    <RoomNode
                      key={layout.id}
                      layout={layout}
                      zone={zone}
                      users={users}
                      isSelected={selectedZoneId === layout.id}
                      onClick={() =>
                        setSelectedZone(selectedZoneId === layout.id ? null : layout.id)
                      }
                    />
                  )
                })}

                {/* NPCs — compañeros de equipo falsos */}
                {allNPCs.map((npc) => (
                  <NPCAvatar key={npc.id} user={npc} />
                ))}

                {/* Peers remotos — usuarios reales conectados en tiempo real */}
                {Object.values(peers).map((peer) => (
                  <PeerAvatar key={peer.userId} peer={peer} />
                ))}

                {/* Jugador local — siempre por encima de todos */}
                <PlayerAvatar />
              </div>
            </TransformComponent>

            {/* ── Cámara — dentro de TransformWrapper, sin DOM ── */}
            <CameraController containerRef={mapAreaRef} />

            {/* ── Overlays fijos (no se transforman) ────────── */}
            <div className="absolute top-3 right-3 z-20 pointer-events-none">
              <StatusLegend />
            </div>
            <div className="absolute bottom-4 left-4 z-20">
              <MapControls />
            </div>

            {/* Work mode selector — bottom-right */}
            <div className="absolute bottom-4 right-4 z-20">
              <WorkModePicker />
            </div>

            {/* Proximity interaction panel — bottom-left, above MapControls */}
            <ProximityPanel />

            {/* Notificación de proximidad a NPCs */}
            <ProximityToast />
          </TransformWrapper>
        </div>

        {/* Panel lateral de detalle — contextual por sala */}
        <MapSidebar
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
        />
      </div>

      {/* ── Footer del mapa ───────────────────────────────── */}
      <MapFooter />
    </div>
  )
}

// ─── Leyenda de estado ────────────────────────────────────────────────────────

function StatusLegend() {
  const items = [
    { color: 'bg-green-500',  label: 'Disponible' },
    { color: 'bg-orange-500', label: 'Ocupado'    },
    { color: 'bg-red-500',    label: 'En reunión' },
    { color: 'bg-zinc-400',   label: 'Ausente'    },
  ]
  return (
    <div className="
      flex items-center gap-3
      bg-[var(--color-bg-primary)]/90 border border-[var(--color-border-secondary)]
      rounded-lg px-3 py-2 backdrop-blur-sm
    ">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
          <span className="text-[10px] text-[var(--color-text-quaternary)]">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Footer del mapa ──────────────────────────────────────────────────────────

function MapFooter() {
  const totalOnline    = Array.from(new Set(Object.values(ZONE_OCCUPANCY).flat())).length
  const totalRooms     = OFFICE_ZONES.length
  const activeRooms    = Object.values(ZONE_OCCUPANCY).filter((ids) => ids.length > 0).length
  const currentZoneId  = usePlayerStore((s) => s.currentZoneId)
  const currentZone    = currentZoneId ? OFFICE_ZONES.find((z) => z.id === currentZoneId) : null
  const isRTConnected  = useRealtimeStore((s) => s.isConnected)
  const peersCount     = useRealtimeStore((s) => Object.keys(s.peers).length)

  return (
    <div className="
      flex-shrink-0 h-9 flex items-center justify-between
      px-4 border-t border-[var(--color-border-secondary)]
      bg-[var(--color-bg-secondary)] theme-transition
    ">
      <div className="flex items-center gap-4 text-[11px] text-[var(--color-fg-quaternary)]">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {totalOnline} {totalOnline === 1 ? 'persona online' : 'personas online'}
        </span>
        <span className="text-[var(--color-fg-quaternary)]">·</span>
        <span>{activeRooms}/{totalRooms} salas activas</span>
        {/* Ubicación actual del player */}
        {currentZone && (
          <>
            <span className="text-[var(--color-fg-quaternary)]">·</span>
            <span className="flex items-center gap-1">
              <span>📍</span>
              <span className={currentZone.labelClass}>{currentZone.name}</span>
            </span>
          </>
        )}
        {!currentZone && (
          <>
            <span className="text-[var(--color-fg-quaternary)]">·</span>
            <span className="text-[var(--color-fg-quaternary)]">En corredor</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-5 text-[10px] text-[var(--color-fg-quaternary)]">

        {/* Indicador de conexión Realtime */}
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-500 ${
            isRTConnected ? 'bg-indigo-400' : 'bg-[var(--color-border-primary)]'
          }`} />
          <span className={isRTConnected ? 'text-indigo-400' : 'text-[var(--color-fg-quaternary)]'}>
            {isRTConnected
              ? peersCount > 0 ? `${peersCount + 1} online` : 'conectado'
              : 'offline'
            }
          </span>
        </span>

        <span className="flex items-center gap-1.5">
          <span className="flex gap-0.5">
            {['W','A','S','D'].map((k) => (
              <kbd key={k} className="
                inline-flex items-center justify-center
                w-4 h-4 rounded text-[8px] font-mono font-semibold
                bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)]
                text-[var(--color-text-quaternary)]
              ">{k}</kbd>
            ))}
          </span>
          <span>mover</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 h-4 rounded text-[8px] bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] font-mono text-[var(--color-text-quaternary)]">Scroll</kbd>
          <span>zoom</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 h-4 rounded text-[8px] bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] font-mono text-[var(--color-text-quaternary)]">Drag</kbd>
          <span>explorar</span>
        </span>
      </div>
    </div>
  )
}
