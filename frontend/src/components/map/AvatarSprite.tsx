'use client'

// AvatarSprite — "Calm Bean" pixel avatar (Visual Polish Sprint)
//
// Estilo: Among Us minimal profesional.
// Forma: blob/pill body con visor oscuro (glass screen).
// Sin piernas ni brazos visibles — forma limpia, ultra-legible a escala pequeña.
// Identidad por color de body (6 colores premium) + iniciales en el visor.
//
// Sistema de dirección via CSS data-attributes (cero JS por frame):
//   data-dir    = "left" | "right" | "up" | "down"
//   data-moving = "true" | "false"
//
// La mochila cambia de lado (CSS) según data-dir.
// El hop walk se maneja en el contenedor externo (floatRef/avatarWalk CSS).
// No hay scaleX flip — el blob es simétrico por diseño.
//
// forwardRef expone el <svg> para dataset mutation directa desde el padre.

import { forwardRef } from 'react'
import type { BlobColor } from '@/lib/visual-system'

// ─── Dimensiones (re-exportadas para uso en PlayerAvatar/PeerAvatar) ──────────

/** Ancho del viewport del sprite */
export const SPRITE_W        = 32
/** Alto del viewport del sprite */
export const SPRITE_H        = 48
/** Offset X para centrar el sprite sobre la posición del jugador */
export const SPRITE_OFFSET_X = 16
/** Offset Y: el "ancla" visual está al 58% del alto (zona torso) */
export const SPRITE_OFFSET_Y = 28

// ─── Helper: iniciales ────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AvatarSpriteProps {
  color:     BlobColor
  initials:  string
  isPlayer?: boolean   // anillo indigo de identificación
}

// ─── Componente ───────────────────────────────────────────────────────────────

export const AvatarSprite = forwardRef<SVGSVGElement, AvatarSpriteProps>(
  function AvatarSprite({ color, initials, isPlayer = false }, ref) {
    const B  = color.body   // color principal del body
    const D  = color.dark   // tono oscuro (mochila, highlight inverso)

    // Visor — siempre dark, glass feel (contrasta bien en light y dark map)
    const V  = '#1A1624'    // fondo del visor
    const VG = '#241E38'    // vidrio del visor (ligeramente más claro)

    return (
      <svg
        ref={ref}
        className="avatar-svg"
        width={SPRITE_W}
        height={SPRITE_H}
        viewBox={`0 0 ${SPRITE_W} ${SPRITE_H}`}
        data-dir="down"
        data-moving="false"
        style={{ overflow: 'visible' }}
        aria-hidden
      >

        {/* ══════════════════════════════════════════════════════════
            SOMBRA EN EL SUELO — ancla el avatar al suelo
        ══════════════════════════════════════════════════════════ */}

        {/* Sombra base — oscura, siempre presente */}
        <ellipse
          cx="16" cy="44.5"
          rx="11" ry="3.2"
          fill="black" opacity="0.35"
        />

        {/* Ground glow — solo visible en dark mode (CSS .avatar-ground-glow) */}
        {/* Simula el avatar proyectando calor/luz al suelo — integración nocturna */}
        <ellipse
          className="avatar-ground-glow"
          cx="16" cy="44"
          rx="14" ry="4.5"
          fill="rgba(255,200,100,0.18)"
          style={{ transition: 'opacity 0.3s' }}
        />

        {/* ══════════════════════════════════════════════════════════
            CUERPO PRINCIPAL — pill/bean shape
        ══════════════════════════════════════════════════════════ */}

        {/* Body drop shadow (offset SE → reads as 3D depth) */}
        <rect
          x="6.5" y="6.5"
          width="21" height="33"
          rx="10.5"
          fill="#000"
          opacity="0.25"
        />
        {/* Body color outline (material edge definition) */}
        <rect
          x="5.5" y="5.5"
          width="21" height="33"
          rx="10.5"
          fill={D}
          opacity="0.42"
        />

        {/* Body fill */}
        <rect
          x="5" y="4"
          width="22" height="33"
          rx="11"
          fill={B}
        />

        {/* Body top gradient — lighter = overhead light hitting the dome */}
        <rect
          x="5" y="4"
          width="22" height="16"
          rx="11"
          fill="white"
          opacity="0.062"
        />
        {/* Body bottom gradient — darker = shadow / weight */}
        <rect
          x="5" y="27"
          width="22" height="10"
          rx="8"
          fill="black"
          opacity="0.16"
        />

        {/* Surface shine — top-left specular (light from upper-left) */}
        <ellipse
          cx="11.5" cy="10"
          rx="5.5" ry="4"
          fill="white"
          opacity="0.16"
        />

        {/* Bottom color shadow (body weight) */}
        <rect
          x="5" y="28"
          width="22" height="9"
          rx="11"
          fill={D}
          opacity="0.32"
        />

        {/* ══════════════════════════════════════════════════════════
            MOCHILA — cambia de lado con data-dir via CSS
        ══════════════════════════════════════════════════════════ */}

        {/* Mochila derecha (default) */}
        <g className="backpack-r">
          <rect x="24" y="11" width="7" height="10" rx="3.5" fill={D} />
          {/* Detalle de correa */}
          <rect x="25" y="14" width="5" height="1" rx="0.5" fill={B} opacity="0.3" />
        </g>

        {/* Mochila izquierda (dir="left") — oculta por CSS por defecto */}
        <g className="backpack-l">
          <rect x="1" y="11" width="7" height="10" rx="3.5" fill={D} />
          <rect x="2" y="14" width="5" height="1" rx="0.5" fill={B} opacity="0.3" />
        </g>

        {/* ══════════════════════════════════════════════════════════
            VISOR — glass screen / face area
        ══════════════════════════════════════════════════════════ */}

        {/* Marco del visor */}
        <rect
          x="7" y="6"
          width="18" height="16"
          rx="8"
          fill={V}
        />

        {/* Superficie de vidrio */}
        <rect
          x="8" y="7"
          width="16" height="14"
          rx="7"
          fill={VG}
          opacity="0.95"
        />

        {/* Reflejo de vidrio (shine) */}
        <rect
          x="9.5" y="8.5"
          width="8" height="3"
          rx="1.5"
          fill="white"
          opacity="0.20"
        />

        {/* Reflejo secundario (más sutil) */}
        <rect
          x="18.5" y="9"
          width="3.5" height="2"
          rx="1"
          fill="white"
          opacity="0.08"
        />

        {/* ── Iniciales en el visor ───────────────────────────── */}
        <text
          x="16"
          y="17.5"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={initials.length > 1 ? '6.5' : '8'}
          fontWeight="700"
          fill="white"
          opacity="0.92"
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          letterSpacing="0.5"
        >
          {initials}
        </text>

        {/* ══════════════════════════════════════════════════════════
            ANILLO DE JUGADOR LOCAL — solo isPlayer
        ══════════════════════════════════════════════════════════ */}
        {isPlayer && (
          <>
            {/* Glow ring exterior */}
            {/* Outer glow ring */}
            <rect
              x="1.5" y="0.5"
              width="29" height="40"
              rx="13.5"
              fill="none"
              stroke="#7C3AED"
              strokeWidth="2.5"
              opacity="0.55"
            />
            {/* Inner accent ring */}
            <rect
              x="3.5" y="2.5"
              width="25" height="36"
              rx="12"
              fill="none"
              stroke="#C4B5FD"
              strokeWidth="0.8"
              opacity="0.30"
            />
          </>
        )}

      </svg>
    )
  }
)
