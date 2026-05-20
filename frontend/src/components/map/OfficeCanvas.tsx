'use client'

// OfficeCanvas — componente principal del mapa espacial de Kubik
//
// Arquitectura:
//   · Canvas estático (dibuja UNA VEZ en mount via drawOfficeWorld)
//   · DOM overlay (avatares — se mueven sobre el canvas sin re-renderizar el fondo)
//   · react-zoom-pan-pinch — zoom/pan por gesto del usuario
//   · CameraController — sigue al jugador con lerp suave (rAF)
//
// Qué reemplaza:
//   · InteractiveMap.tsx  — contenedor anterior
//   · FloorPlanSVG.tsx    — fondo SVG anterior
//   · RoomNode × N        — tarjetas de sala (eliminadas — ahora son zonas espaciales)
//
// Qué se mantiene sin cambios:
//   · PlayerAvatar, PeerAvatar, NPCAvatar
//   · CameraController, MapControls, ProximityPanel
//   · useMovement, useRealtimePresence, useSessionsSync
//   · Zustand stores (playerStore, officeStore, realtimeStore)

import { useRef, useEffect, useCallback, CSSProperties } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { useUser } from '@clerk/nextjs'

import { useOfficeStore }      from '@/store/office.store'
import { usePlayerStore }      from '@/store/player.store'
import { useRealtimeStore }    from '@/store/realtime.store'
import { useMovement }           from '@/hooks/useMovement'
import { useRealtimePresence }   from '@/hooks/useRealtimePresence'
import { useSessionsSync }       from '@/hooks/useSessionsSync'
import { useProfileSync }        from '@/hooks/useProfileSync'
import { useTheme }              from '@/context/ThemeContext'
import { useSpatialDetection }   from '@/hooks/useSpatialDetection'
import { useLiveKitRoom }        from '@/hooks/useLiveKitRoom'
import { useSpatialAudio }       from '@/hooks/useSpatialAudio'
import { useInteractionEvents }  from '@/hooks/useInteractionEvents'

import { MOCK_USERS, OFFICE_ZONES } from '@/lib/mock-data'
import { WORLD_W, WORLD_H }         from '@/lib/office-geometry'
import { drawOfficeWorld }           from '@/lib/canvas-office'

import { PlayerAvatar }     from './PlayerAvatar'
import { NPCAvatar }        from './NPCAvatar'
import { PeerAvatar }       from './PeerAvatar'
import { WorldSceneLayer }       from './WorldSceneLayer'
import { UserInteractionCard }   from './UserInteractionCard'
import { CameraController }   from './CameraController'
import { MapControls }        from './MapControls'
import { ZoneCard }           from './ZoneCard'
import { ProximityToast }     from './ProximityToast'
import { ProximityPanel }     from './ProximityPanel'
import { WorkModePicker }     from './WorkModePicker'
import { VoiceBar }           from '@/components/audio/VoiceBar'
import { IncomingCallCard }   from '@/components/social/IncomingCallCard'
import { CallBubble }         from '@/components/social/CallBubble'
import { VideoCallWindow }    from '@/components/social/VideoCallWindow'
import { SocialNotification } from '@/components/social/SocialNotification'

// ─── Constantes de cámara ─────────────────────────────────────────────────────

/** Zoom inicial: ajusta el mundo de 1920px para que quepa bien en pantalla */
const INITIAL_SCALE = 0.62
const MIN_SCALE     = 0.22
const MAX_SCALE     = 2.8

// ─── OfficeCanvas ─────────────────────────────────────────────────────────────

export function OfficeCanvas() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const mapAreaRef   = useRef<HTMLDivElement>(null)
  const isGrabbingRef = useRef(false)

  // ── Inicialización del jugador ──────────────────────────────────────────────
  const { user }    = useUser()
  const initPlayer  = usePlayerStore((s) => s.init)
  const { theme }   = useTheme()

  useEffect(() => {
    if (user) {
      initPlayer(
        user.fullName ?? user.username ?? 'You',
        user.imageUrl ?? null,
      )
    }
  }, [user, initPlayer])

  // ── Dibujo del mundo — re-ejecuta cuando cambia el tema ──────────────────
  const drawWorld = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio ?? 1

    // Solo configurar dimensiones la primera vez (evita reflow)
    if (canvas.width !== WORLD_W * dpr) {
      canvas.width        = WORLD_W * dpr
      canvas.height       = WORLD_H * dpr
      canvas.style.width  = `${WORLD_W}px`
      canvas.style.height = `${WORLD_H}px`
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Image smoothing — suaviza el canvas cuando el usuario hace zoom
    ctx.imageSmoothingEnabled  = true
    ctx.imageSmoothingQuality  = 'high'

    // Resetear el transform al DPR exacto antes de cada redraw
    // (evita acumulación si el efecto se re-ejecuta)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    drawOfficeWorld(ctx, theme)
  }, [theme])

  useEffect(() => {
    drawWorld()
  }, [drawWorld])

  // ── Motores del juego ──────────────────────────────────────────────────────
  useMovement()
  useRealtimePresence()
  useSessionsSync()
  useProfileSync()            // ← upsert perfil en Supabase al iniciar sesión
  useSpatialDetection()   // ← Fase A: detección de proximidad espacial
  useLiveKitRoom()        // ← Fase B: conexión LiveKit (audio)
  useSpatialAudio()       // ← Fase B: ganancia espacial por proximidad
  useInteractionEvents()  // ← Fase B: knock, chat, llamadas, typing

  // ── Datos de estado ────────────────────────────────────────────────────────
  const { selectedZoneId, setSelectedZone } = useOfficeStore()
  const peers = useRealtimeStore((s) => s.peers)

  const selectedZone = selectedZoneId
    ? OFFICE_ZONES.find((z) => z.id === selectedZoneId) ?? null
    : null

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* ── Área del mapa ─────────────────────────────────────────────────── */}
      <div
        ref={mapAreaRef}
        className="flex-1 relative overflow-hidden cursor-grab"
        style={{ backgroundColor: 'var(--map-bg)' }}
      >
        {/* Vignette edge darkening — profundidad y enfoque (theme-adaptive) */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            boxShadow: theme === 'dark'
              ? 'inset 0 0 140px rgba(0,0,0,0.55)'
              : 'inset 0 0 120px rgba(0,0,0,0.18)',
          }}
        />

        <TransformWrapper
          initialScale={INITIAL_SCALE}
          minScale={MIN_SCALE}
          maxScale={MAX_SCALE}
          centerOnInit
          limitToBounds={false}
          smooth
          wheel={{ step: 0.07 }}
          panning={{ velocityDisabled: false }}
          doubleClick={{ mode: 'zoomIn', step: 0.4 }}
          onPanningStart={() => {
            isGrabbingRef.current = true
            mapAreaRef.current?.classList.replace('cursor-grab', 'cursor-grabbing')
          }}
          onPanningStop={() => {
            isGrabbingRef.current = false
            mapAreaRef.current?.classList.replace('cursor-grabbing', 'cursor-grab')
          }}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            wrapperClass="select-none"
          >
            {/* ── Contenedor del mundo (canvas + overlay en el mismo espacio) ── */}
            <div
              className="relative"
              style={{ width: WORLD_W, height: WORLD_H }}
            >
              {/* Canvas estático — suelo, paredes, luz ambiental (no re-renderiza) */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 pixel-art"
                style={{ display: 'block' }}
              />

              {/* SVG ilustrado — muebles, props, ambiente (z:1, sobre canvas) */}
              <WorldSceneLayer />

              {/* Capa de deselección de zona (click en espacio vacío) */}
              {selectedZoneId && (
                <div
                  className="absolute inset-0"
                  style={{ zIndex: 1 }}
                  onClick={() => setSelectedZone(null)}
                />
              )}

              {/* ── Overlay de avatares — mismo espacio de coordenadas que el canvas ── */}
              {/* pointer-events:none en el div padre — los avatares gestionan sus propios eventos */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 2 }}
              >
                {/* NPCs — compañeros falsos, posiciones fijas */}
                {MOCK_USERS.map((npc) => (
                  <NPCAvatar key={npc.id} user={npc} />
                ))}

                {/* Peers remotos — usuarios reales, posición interpolada vía rAF */}
                {Object.values(peers).map((peer) => (
                  <PeerAvatar key={peer.userId} peer={peer} />
                ))}

                {/* Jugador local — siempre por encima */}
                <PlayerAvatar />
              </div>
            </div>
          </TransformComponent>

          {/* CameraController debe estar DENTRO de TransformWrapper para acceder al context */}
          <CameraController containerRef={mapAreaRef} />

          {/* ── Overlays HUD (en screen-space, no se transforman con el canvas) ── */}

          {/* ── Spatial Interaction Card (Fase A) ───────────────── */}
          {/* Renderiza en screen space usando useTransformContext */}
          <UserInteractionCard />

          {/* Panel de proximidad — aparece al acercarse a un peer */}
          <ProximityPanel />

          {/* Toast de NPC (parte superior central) */}
          <ProximityToast />

          {/* Selector de work mode (floating, no transforma) */}
          <WorkModePicker />

          {/* Controles de zoom (esquina inferior izquierda) */}
          <div className="absolute bottom-4 left-4 z-20">
            <MapControls />
          </div>

          {/* VoiceBar — control de voz (esquina inferior derecha) */}
          <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
            <VoiceBar />
          </div>

          {/* ── Social Layer (Fase B) ─────────────────────────────────────── */}

          {/* Toast de notificación social (knock, mensaje, llamada perdida) */}
          <SocialNotification />

          {/* Llamada entrante — overlay con pulsating ring */}
          <IncomingCallCard />

          {/* Burbuja flotante de llamada activa — bottom-left, encima de MapControls */}
          <CallBubble />

          {/* Ventana flotante de videollamada — bottom-right, aparece con video activo */}
          <VideoCallWindow />

          {/* ZoneCard — floating contextual overlay, top-right (reemplaza MapSidebar) */}
          {selectedZone && (
            <ZoneCard zone={selectedZone} onClose={() => setSelectedZone(null)} />
          )}
        </TransformWrapper>
      </div>
    </div>
  )
}

// ─── ZoneIndicator ────────────────────────────────────────────────────────────
// Pequeña pill que muestra la zona actual cuando el jugador está en una sala.

function ZoneIndicator({ zoneId }: { zoneId: string }) {
  const zone = OFFICE_ZONES.find((z) => z.id === zoneId)
  if (!zone) return null

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
      bg-[var(--color-bg-primary)]/80 backdrop-blur-sm border border-[var(--color-border-secondary)]
      shadow-md animate-fade-in">
      <span className="text-[10px]">{zone.icon}</span>
      <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">{zone.name}</span>
    </div>
  )
}
