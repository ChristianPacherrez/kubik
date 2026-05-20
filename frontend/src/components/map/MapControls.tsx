'use client'

// MapControls — controles flotantes de zoom premium
//
// Usa los hooks internos de react-zoom-pan-pinch:
//   · useControls()          → zoomIn / zoomOut / resetTransform / centerView
//   · useTransformComponent() → escala actual (re-render selectivo, muy eficiente)
//
// IMPORTANTE: este componente solo puede usarse dentro de un TransformWrapper.
// En Fase 1 aceptaba props mocks; ahora lee el estado real de la transformación.

import { useControls, useTransformComponent } from 'react-zoom-pan-pinch'

interface MapControlsProps {
  /** Callback adicional al hacer reset (e.g. para limpiar estado externo) */
  onReset?: () => void
}

const MIN_ZOOM = 25
const MAX_ZOOM = 300

export function MapControls({ onReset }: MapControlsProps) {
  const { zoomIn, zoomOut, resetTransform } = useControls()

  // useTransformComponent solo re-renderiza cuando cambia el valor retornado.
  // Mucho más eficiente que suscribirse a todos los eventos de transform.
  const zoom = useTransformComponent(({ state }) => Math.round(state.scale * 100))

  const handleReset = () => {
    resetTransform()
    onReset?.()
  }

  return (
    <div className="
      flex items-center gap-0.5
      bg-[var(--color-bg-primary)]/95 border border-[var(--color-border-secondary)]
      rounded-xl shadow-lg shadow-black/30
      backdrop-blur-sm p-1
    ">

      {/* ── Zoom out ──────────────────────────────────────── */}
      <ZoomButton
        onClick={() => zoomOut()}
        disabled={zoom <= MIN_ZOOM}
        title="Alejar  (scroll ↓)"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </ZoomButton>

      {/* ── Porcentaje de zoom — click para resetear ─────── */}
      <button
        onClick={handleReset}
        title="Resetear vista"
        className="
          px-2.5 h-7 rounded-lg
          text-[11px] font-mono font-semibold tabular-nums
          text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]
          hover:bg-[var(--color-bg-primary_hover)]
          transition-all duration-100
          min-w-[46px] text-center
        "
      >
        {zoom}%
      </button>

      {/* ── Zoom in ───────────────────────────────────────── */}
      <ZoomButton
        onClick={() => zoomIn()}
        disabled={zoom >= MAX_ZOOM}
        title="Acercar  (scroll ↑)"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </ZoomButton>

      {/* ── Separador ─────────────────────────────────────── */}
      <div className="w-px h-4 bg-[var(--color-border-secondary)] mx-0.5 flex-shrink-0" />

      {/* ── Encajar en pantalla ───────────────────────────── */}
      <ZoomButton onClick={handleReset} title="Encajar en pantalla">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </ZoomButton>

    </div>
  )
}

// ─── Botón de zoom genérico ───────────────────────────────────────────────────

function ZoomButton({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`
        w-7 h-7 rounded-lg flex items-center justify-center
        transition-all duration-100
        ${disabled
          ? 'text-[var(--color-fg-quaternary)] opacity-40 cursor-not-allowed'
          : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary_hover)] active:scale-90 cursor-pointer'
        }
      `}
    >
      {children}
    </button>
  )
}
