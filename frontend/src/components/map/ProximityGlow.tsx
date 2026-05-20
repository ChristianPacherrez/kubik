'use client'

// ProximityGlow — anillo de presencia espacial alrededor de un avatar
//
// Renderiza DENTRO de PeerAvatar/NPCAvatar (world space).
// Se escala con el zoom del mapa (correcto — la burbuja crece al acercarte).
//
// Zonas → intensidad visual:
//   aura  → anillo exterior muy sutil (solo glow)
//   near  → anillo + prompt "👋"
//   touch → anillo vibrante + indicador de interacción directa

import { useSpatialStore, ProximityZone } from '@/store/spatial.store'
import type { BlobColor }                  from '@/lib/visual-system'
import { SPRITE_W, SPRITE_H }              from './AvatarSprite'

// ─── Zona cfg ─────────────────────────────────────────────────────────────────

const ZONE_CFG: Record<ProximityZone, {
  ring1: number; ring2: number; glow: number
  opacity: number; speed: string; showPrompt: boolean
}> = {
  aura:  { ring1: 56, ring2: 44, glow: 48, opacity: 0.35, speed: '3.2s', showPrompt: false },
  near:  { ring1: 62, ring2: 50, glow: 54, opacity: 0.55, speed: '2.4s', showPrompt: true  },
  touch: { ring1: 68, ring2: 56, glow: 60, opacity: 0.80, speed: '1.6s', showPrompt: true  },
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  userId:  string
  color:   BlobColor
  isNpc?:  boolean
}

export function ProximityGlow({ userId, color, isNpc = false }: Props) {
  const zone = useSpatialStore((s) => s.zones[userId])

  if (!zone) return null

  const cfg = ZONE_CFG[zone]

  // Centro visual del blob (excluyendo sombra inferior)
  const cx = SPRITE_W / 2
  const cy = SPRITE_H / 2 - 6  // ligero offset al torso

  return (
    <div
      aria-hidden
      style={{
        position:      'absolute',
        inset:         0,
        pointerEvents: 'none',
        overflow:      'visible',
      }}
    >
      {/* ── Outer ring — pulsing ──────────────────────────── */}
      <div
        style={{
          position:     'absolute',
          left:          cx - cfg.ring1 / 2,
          top:           cy - cfg.ring1 / 2,
          width:         cfg.ring1,
          height:        cfg.ring1,
          borderRadius:  '50%',
          border:        `1.5px solid ${color.body}`,
          opacity:       cfg.opacity * 0.7,
          animation:     `spatialRingPulse ${cfg.speed} ease-in-out infinite`,
        }}
      />

      {/* ── Inner ring ────────────────────────────────────── */}
      <div
        style={{
          position:     'absolute',
          left:          cx - cfg.ring2 / 2,
          top:           cy - cfg.ring2 / 2,
          width:         cfg.ring2,
          height:        cfg.ring2,
          borderRadius:  '50%',
          border:        `1px solid ${color.body}`,
          opacity:       cfg.opacity,
          animation:     `spatialRingPulse ${cfg.speed} ease-in-out 0.4s infinite`,
        }}
      />

      {/* ── Radial glow (ambient light) ───────────────────── */}
      <div
        style={{
          position:   'absolute',
          left:        cx - cfg.glow / 2,
          top:         cy - cfg.glow / 2,
          width:       cfg.glow,
          height:      cfg.glow,
          borderRadius:'50%',
          background:  `radial-gradient(circle, ${color.body}22 0%, ${color.body}08 55%, transparent 75%)`,
          animation:   `spatialGlowFade ${cfg.speed} ease-in-out infinite`,
        }}
      />

      {/* ── Interaction prompt (near/touch only) ──────────── */}
      {cfg.showPrompt && (
        <div
          style={{
            position:        'absolute',
            top:             -(zone === 'touch' ? 26 : 20),
            left:            '50%',
            transform:       'translateX(-50%)',
            whiteSpace:      'nowrap',
            pointerEvents:   'none',
            userSelect:      'none',
            animation:       'spatialPromptIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        >
          <span
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            3,
              padding:        zone === 'touch' ? '2px 7px' : '1.5px 5px',
              borderRadius:   '999px',
              fontSize:       zone === 'touch' ? 9 : 8,
              fontWeight:     700,
              letterSpacing:  '0.01em',
              background:     `${color.body}22`,
              border:         `1px solid ${color.body}50`,
              color:          color.body,
              backdropFilter: 'blur(4px)',
              lineHeight:     1.5,
            }}
          >
            {zone === 'touch' ? (
              <>
                <span style={{ fontSize: 8 }}>●</span>
                {isNpc ? 'Ver perfil' : 'Interactuar'}
              </>
            ) : (
              '👋'
            )}
          </span>
        </div>
      )}
    </div>
  )
}
