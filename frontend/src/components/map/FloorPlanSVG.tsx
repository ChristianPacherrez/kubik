'use client'

// FloorPlanSVG — premium visual backdrop (Depth + Environment Quality pass)
//
// Render order (painter's algorithm — each layer composites over the previous):
//
//   1.  Canvas background (warm cream base)
//   2.  Room floor fills (richer, staggered patterns with grain highlights)
//   3.  Ceiling light simulation (warm top-center radial per room → fakes overhead lamp)
//   4.  Per-room color ambient (identity glow at 55% center)
//   5.  Room ambient occlusion (edges darker than center → depth perception)
//   6.  North wall depth band (top strip per room is darkest → wall viewed from above)
//   7.  Room south/east/west edge shadows (secondary AO passes)
//   8.  Corridors (light floor + ceiling grid + center reflection hint)
//   9.  Corridor edge drop shadows (rooms cast shadows into corridors)
//  10.  Surface grain overlay (2×2 dither → material/screen-print feel)
//  11.  Room accent inner borders (subtle color outline)
//  12.  Architectural wall lines (corridor edges, office boundary)
//  13.  Outer office frame (40px margin rendered slightly darker)
//  14.  3D pillars (cast shadow + body + top-left highlight)
//  15.  Map vignette (radial dark from edges → focus center)
//  16.  Corridor centerlines + labels
//  17.  Compass + scale

import { MAP_WIDTH, MAP_HEIGHT, CORRIDORS, PILLARS, ROOM_LAYOUTS } from '@/lib/map-layout'

// ─── Visual config per room ───────────────────────────────────────────────────

const ROOM_VISUAL: Record<string, {
  glow:        string   // ambient tint color
  glowOpacity: number
  floorId:     string   // SVG pattern id
  lightWarm:   string   // ceiling light warmth (CSS color string)
}> = {
  lobby:     { glow: '#F59E0B', glowOpacity: 0.18, floorId: 'floor-wood-warm',     lightWarm: '#FFF8E8' },
  focus:     { glow: '#6366F1', glowOpacity: 0.16, floorId: 'floor-carpet',        lightWarm: '#F4F3FF' },
  meeting:   { glow: '#8B5CF6', glowOpacity: 0.14, floorId: 'floor-concrete-lg',   lightWarm: '#F5F2FF' },
  cafeteria: { glow: '#10B981', glowOpacity: 0.16, floorId: 'floor-wood-diagonal', lightWarm: '#ECFDF5' },
  collab:    { glow: '#06B6D4', glowOpacity: 0.14, floorId: 'floor-concrete-grid', lightWarm: '#ECFEFF' },
  support:   { glow: '#F43F5E', glowOpacity: 0.12, floorId: 'floor-wood-oak',      lightWarm: '#FFF1F3' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FloorPlanSVG() {
  return (
    <svg
      width={MAP_WIDTH}
      height={MAP_HEIGHT}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 pointer-events-none select-none"
      aria-hidden
    >
      <defs>

        {/* ══════════════════════════════════════════════════════════
            FLOOR PATTERNS — warm light materials, staggered planks
        ══════════════════════════════════════════════════════════ */}

        {/* Lobby — staggered warm hardwood planks (2-row repeat, offset joints) */}
        <pattern id="floor-wood-warm" width="120" height="14" patternUnits="userSpaceOnUse">
          {/* Row 1 planks — warm honey maple */}
          <rect width="120" height="6.5" fill="#D4B896" />
          {/* Grain lines within planks */}
          <line x1="0"  y1="2.5" x2="40"  y2="2.5" stroke="#BCA070" strokeWidth="0.45" opacity="0.35" />
          <line x1="40" y1="1.8" x2="80"  y2="1.8" stroke="#B89868" strokeWidth="0.4"  opacity="0.28" />
          <line x1="80" y1="3.2" x2="120" y2="3.2" stroke="#BA9C6C" strokeWidth="0.4"  opacity="0.30" />
          {/* Plank end joints */}
          <line x1="40"  y1="0" x2="40"  y2="6.5" stroke="#A08060" strokeWidth="0.7" opacity="0.55" />
          <line x1="80"  y1="0" x2="80"  y2="6.5" stroke="#A28262" strokeWidth="0.7" opacity="0.50" />
          {/* Top-surface light reflection strip */}
          <rect width="120" height="1.2" fill="white" opacity="0.18" />
          {/* Grout seam */}
          <rect y="6.5" width="120" height="1" fill="#987848" />
          {/* Row 2 planks (offset 20px for stagger) */}
          <rect y="7.5" width="120" height="6.5" fill="#CCB088" />
          <line x1="20"  y1="10"  x2="60"  y2="10"  stroke="#B89868" strokeWidth="0.4"  opacity="0.32" />
          <line x1="60"  y1="9.2" x2="100" y2="9.2" stroke="#B49468" strokeWidth="0.35" opacity="0.28" />
          <line x1="20"  y1="7.5" x2="20"  y2="14" stroke="#9E7E5E" strokeWidth="0.7" opacity="0.50" />
          <line x1="60"  y1="7.5" x2="60"  y2="14" stroke="#9E8060" strokeWidth="0.7" opacity="0.48" />
          <line x1="100" y1="7.5" x2="100" y2="14" stroke="#9C7E5C" strokeWidth="0.7" opacity="0.45" />
          <rect y="7.5" width="120" height="1.2" fill="white" opacity="0.14" />
        </pattern>

        {/* Focus — soft woven office carpet (warm lavender-grey) */}
        <pattern id="floor-carpet" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#D2CEE6" />
          {/* Woven grid (warp + weft) */}
          <line x1="4" y1="0" x2="4" y2="8" stroke="#BEB8D4" strokeWidth="0.45" opacity="0.55" />
          <line x1="0" y1="4" x2="8" y2="4" stroke="#BCB6D2" strokeWidth="0.45" opacity="0.55" />
          {/* Pile dots at intersections */}
          <circle cx="0" cy="0" r="0.65" fill="#C8C2DC" opacity="0.70" />
          <circle cx="8" cy="0" r="0.65" fill="#C6C0DA" opacity="0.65" />
          <circle cx="0" cy="8" r="0.65" fill="#C8C2DC" opacity="0.65" />
          <circle cx="8" cy="8" r="0.65" fill="#C4BED8" opacity="0.60" />
          <circle cx="4" cy="4" r="0.80" fill="#CAC4DE" opacity="0.75" />
          {/* Subtle nap direction diagonal */}
          <line x1="1.5" y1="1.5" x2="3.5" y2="3.5" stroke="#B8B2CC" strokeWidth="0.3" opacity="0.28" />
        </pattern>

        {/* Meeting — warm polished concrete tiles with sheen */}
        <pattern id="floor-concrete-lg" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill="#D6D2CA" />
          {/* Grout seams (slightly inset) */}
          <line x1="0"  y1="80" x2="80" y2="80" stroke="#B8B4AC" strokeWidth="1.4" opacity="0.65" />
          <line x1="80" y1="0"  x2="80" y2="80" stroke="#B8B4AC" strokeWidth="1.4" opacity="0.65" />
          {/* Tile inner shadow ring */}
          <rect x="1" y="1" width="78" height="78" fill="none" stroke="#C8C4BC" strokeWidth="0.5" opacity="0.30" />
          {/* Polished-concrete top-left sheen */}
          <ellipse cx="22" cy="19" rx="18" ry="9" fill="white" opacity="0.10" />
          {/* Aggregate speckle */}
          <circle cx="48" cy="54" r="1.8" fill="#C4C0B8" opacity="0.50" />
          <circle cx="18" cy="67" r="1.2" fill="#C0BCB4" opacity="0.42" />
          <circle cx="66" cy="32" r="1.1" fill="#C8C4BC" opacity="0.38" />
          <circle cx="34" cy="22" r="0.9" fill="#C4C0B8" opacity="0.35" />
        </pattern>

        {/* Cafeteria — diagonal herringbone hardwood (warm honey tone) */}
        <pattern id="floor-wood-diagonal" width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill="#C8B88A" />
          {/* Primary 45° grain */}
          <line x1="0"  y1="28" x2="28" y2="0"  stroke="#B4A070" strokeWidth="2.0" opacity="0.42" />
          <line x1="-7" y1="21" x2="21" y2="-7" stroke="#B09A6C" strokeWidth="0.9" opacity="0.28" />
          <line x1="7"  y1="35" x2="35" y2="7"  stroke="#AE9868" strokeWidth="0.9" opacity="0.26" />
          {/* Counter-grain (135°) */}
          <line x1="0"  y1="0"  x2="28" y2="28" stroke="#BAA878" strokeWidth="0.6" opacity="0.20" />
          {/* Surface reflection at pattern top */}
          <rect width="28" height="1.2" fill="white" opacity="0.15" />
        </pattern>

        {/* Collab — light concrete grid (cool blue-grey) */}
        <pattern id="floor-concrete-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#CDD1D8" />
          {/* Major grid */}
          <line x1="40" y1="0"  x2="40" y2="40" stroke="#ACB0BC" strokeWidth="1.0" opacity="0.60" />
          <line x1="0"  y1="40" x2="40" y2="40" stroke="#ACB0BC" strokeWidth="1.0" opacity="0.60" />
          {/* Sub-grid (half spacing) */}
          <line x1="20" y1="0"  x2="20" y2="40" stroke="#C0C4CC" strokeWidth="0.35" opacity="0.40" />
          <line x1="0"  y1="20" x2="40" y2="20" stroke="#C0C4CC" strokeWidth="0.35" opacity="0.40" />
          {/* Tile sheen (top-left corner of each tile) */}
          <ellipse cx="9"  cy="7"  rx="7" ry="3" fill="white" opacity="0.07" />
        </pattern>

        {/* Support — warm oak parquet (3-row stagger) */}
        <pattern id="floor-wood-oak" width="96" height="12" patternUnits="userSpaceOnUse">
          {/* Row 1 */}
          <rect width="96" height="5.5" fill="#CCB08A" />
          <line x1="0"  y1="2.2" x2="32" y2="2.2" stroke="#B89870" strokeWidth="0.4"  opacity="0.32" />
          <line x1="32" y1="1.5" x2="64" y2="1.5" stroke="#B49468" strokeWidth="0.35" opacity="0.28" />
          <line x1="64" y1="2.8" x2="96" y2="2.8" stroke="#B69668" strokeWidth="0.38" opacity="0.30" />
          <line x1="32" y1="0" x2="32" y2="5.5" stroke="#9C7A58" strokeWidth="0.6" opacity="0.48" />
          <line x1="64" y1="0" x2="64" y2="5.5" stroke="#9E7C5A" strokeWidth="0.6" opacity="0.46" />
          <rect width="96" height="1.1" fill="white" opacity="0.16" />
          {/* Grout */}
          <rect y="5.5" width="96" height="1" fill="#A08060" />
          {/* Row 2 (offset 16px) */}
          <rect y="6.5" width="96" height="5.5" fill="#C4A880" />
          <line x1="16" y1="8.8"  x2="48" y2="8.8"  stroke="#B49268" strokeWidth="0.4"  opacity="0.30" />
          <line x1="48" y1="8.2"  x2="80" y2="8.2"  stroke="#B09068" strokeWidth="0.35" opacity="0.26" />
          <line x1="16" y1="6.5" x2="16" y2="12" stroke="#9A7856" strokeWidth="0.6" opacity="0.46" />
          <line x1="48" y1="6.5" x2="48" y2="12" stroke="#9C7A58" strokeWidth="0.6" opacity="0.44" />
          <line x1="80" y1="6.5" x2="80" y2="12" stroke="#987658" strokeWidth="0.6" opacity="0.42" />
          <rect y="6.5" width="96" height="1.1" fill="white" opacity="0.12" />
        </pattern>

        {/* Corridor — refined terrazzo look (warm neutral) */}
        <pattern id="floor-corridor-dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="transparent" />
          <circle cx="10" cy="10" r="0.9" fill="#9898A8" opacity="0.30" />
          <circle cx="0"  cy="0"  r="0.55" fill="#9090A0" opacity="0.22" />
          <circle cx="20" cy="0"  r="0.55" fill="#8E8E9E" opacity="0.20" />
          <circle cx="0"  cy="20" r="0.55" fill="#9090A0" opacity="0.20" />
          <circle cx="20" cy="20" r="0.55" fill="#8C8C9C" opacity="0.18" />
        </pattern>

        {/* Corridor — ceiling tile grid (very light) */}
        <pattern id="corridor-ceiling-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="transparent" />
          <line x1="32" y1="0"  x2="32" y2="32" stroke="#B0B4C0" strokeWidth="0.4" opacity="0.45" />
          <line x1="0"  y1="32" x2="32" y2="32" stroke="#B0B4C0" strokeWidth="0.4" opacity="0.45" />
        </pattern>

        {/* Surface grain (2×2 dither — cheap material texture) */}
        <pattern id="surface-grain" width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="1" height="1" x="0" y="0" fill="white" opacity="0.020" />
          <rect width="1" height="1" x="1" y="1" fill="white" opacity="0.015" />
          <rect width="1" height="1" x="1" y="0" fill="black" opacity="0.010" />
          <rect width="1" height="1" x="0" y="1" fill="black" opacity="0.008" />
        </pattern>

        {/* ══════════════════════════════════════════════════════════
            DEPTH GRADIENTS — lighting simulation (black overlays work on light surfaces too)
        ══════════════════════════════════════════════════════════ */}

        {/* North wall shadow (top of room is darkest — wall viewed from above) */}
        <linearGradient id="depth-wall-n" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#000" stopOpacity="0.32" />
          <stop offset="30%"  stopColor="#000" stopOpacity="0.12" />
          <stop offset="75%"  stopColor="#000" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </linearGradient>

        {/* South edge AO */}
        <linearGradient id="depth-edge-s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#000" stopOpacity="0" />
          <stop offset="60%"  stopColor="#000" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.10" />
        </linearGradient>

        {/* West edge AO */}
        <linearGradient id="depth-edge-w" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#000" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </linearGradient>

        {/* East edge AO */}
        <linearGradient id="depth-edge-e" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.10" />
        </linearGradient>

        {/* Room ambient occlusion (center bright, edges dark) */}
        <radialGradient id="room-ao" cx="50%" cy="50%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#000" stopOpacity="0" />
          <stop offset="70%"  stopColor="#000" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </radialGradient>

        {/* Corridor shadow from room edges (cast into corridor) */}
        <linearGradient id="corr-shadow-from-l" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#000" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="corr-shadow-from-r" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id="corr-shadow-from-t" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#000" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="corr-shadow-from-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>

        {/* Map vignette (radial from center → dark at edges) */}
        <radialGradient id="map-vignette" cx="50%" cy="50%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#000" stopOpacity="0" />
          <stop offset="60%"  stopColor="#000" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
        </radialGradient>

        {/* ══════════════════════════════════════════════════════════
            PER-ROOM GRADIENT DEFINITIONS (objectBoundingBox)
        ══════════════════════════════════════════════════════════ */}

        {ROOM_LAYOUTS.map((r) => {
          const cfg = ROOM_VISUAL[r.id]
          if (!cfg) return null
          return (
            <g key={`grads-${r.id}`}>
              {/* Ambient glow (identity color) */}
              <radialGradient
                id={`glow-${r.id}`}
                cx="50%" cy="55%" r="62%"
                gradientUnits="objectBoundingBox"
              >
                <stop offset="0%"   stopColor={cfg.glow} stopOpacity={cfg.glowOpacity} />
                <stop offset="50%"  stopColor={cfg.glow} stopOpacity={cfg.glowOpacity * 0.38} />
                <stop offset="100%" stopColor={cfg.glow} stopOpacity={0} />
              </radialGradient>

              {/* Ceiling light (warm overhead lamp from top-center) */}
              <radialGradient
                id={`ceiling-${r.id}`}
                cx="50%" cy="30%" r="55%"
                gradientUnits="objectBoundingBox"
              >
                <stop offset="0%"   stopColor={cfg.lightWarm} stopOpacity="0.22" />
                <stop offset="45%"  stopColor={cfg.lightWarm} stopOpacity="0.08" />
                <stop offset="100%" stopColor={cfg.lightWarm} stopOpacity="0" />
              </radialGradient>
            </g>
          )
        })}

      </defs>

      {/* ── 1. Warm cream base canvas ─────────────────────────────────────────── */}
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#E8E0D0" />

      {/* ── 2. Room floor fills (pattern textures) ─────────────────────────── */}
      {ROOM_LAYOUTS.map((r) => {
        const cfg = ROOM_VISUAL[r.id]
        return (
          <rect
            key={`floor-${r.id}`}
            x={r.x} y={r.y} width={r.width} height={r.height}
            fill={cfg ? `url(#${cfg.floorId})` : '#D8D4C8'}
          />
        )
      })}

      {/* ── 3. Ceiling light (warm radial from top-center per room) ──────────── */}
      {ROOM_LAYOUTS.map((r) => (
        <rect
          key={`ceiling-${r.id}`}
          x={r.x} y={r.y} width={r.width} height={r.height}
          fill={`url(#ceiling-${r.id})`}
        />
      ))}

      {/* ── 4. Per-room ambient color tint ────────────────────────────────── */}
      {ROOM_LAYOUTS.map((r) => (
        <rect
          key={`glow-${r.id}`}
          x={r.x} y={r.y} width={r.width} height={r.height}
          fill={`url(#glow-${r.id})`}
        />
      ))}

      {/* ── 5. Room ambient occlusion (edges darker → depth) ─────────────── */}
      {ROOM_LAYOUTS.map((r) => (
        <rect
          key={`ao-${r.id}`}
          x={r.x} y={r.y} width={r.width} height={r.height}
          fill="url(#room-ao)"
        />
      ))}

      {/* ── 6. North wall depth band (top strip per room) ─────────────────── */}
      {/* This is the single biggest depth trick: the north wall is darkest,
          simulating a top-down view of a physical wall with light falling from above */}
      {ROOM_LAYOUTS.map((r) => (
        <rect
          key={`wall-n-${r.id}`}
          x={r.x} y={r.y} width={r.width} height={32}
          fill="url(#depth-wall-n)"
        />
      ))}

      {/* ── 7. South / East / West edge shadows (secondary AO) ────────────── */}
      {ROOM_LAYOUTS.map((r) => (
        <g key={`edgeao-${r.id}`}>
          <rect x={r.x}                y={r.y + r.height - 22} width={r.width} height={22}
            fill="url(#depth-edge-s)" />
          <rect x={r.x}                y={r.y} width={20}      height={r.height}
            fill="url(#depth-edge-w)" />
          <rect x={r.x + r.width - 20} y={r.y} width={20}      height={r.height}
            fill="url(#depth-edge-e)" />
        </g>
      ))}

      {/* ── 8. Corridors ─────────────────────────────────────────────────── */}
      {CORRIDORS.map((c) => (
        <g key={c.id}>
          {/* Corridor base — warm neutral transition between rooms */}
          <rect x={c.x} y={c.y} width={c.width} height={c.height} fill="#D4CFCA" />
          {/* Ceiling tile grid */}
          <rect x={c.x} y={c.y} width={c.width} height={c.height}
            fill="url(#corridor-ceiling-grid)" />
          {/* Footstep / terrazzo dots */}
          <rect x={c.x} y={c.y} width={c.width} height={c.height}
            fill="url(#floor-corridor-dots)" />
          {/* Center reflection strip (simulates overhead fluorescent on polished floor) */}
          {c.orientation === 'horizontal' ? (
            <rect x={c.x} y={c.y + c.height * 0.35} width={c.width} height={c.height * 0.30}
              fill="white" opacity="0.06" />
          ) : (
            <rect x={c.x + c.width * 0.32} y={c.y} width={c.width * 0.36} height={c.height}
              fill="white" opacity="0.06" />
          )}
        </g>
      ))}

      {/* ── 9. Corridor edge drop shadows (rooms cast shadow into corridors) ── */}
      {/* Left vertical corridor (x 400-460) */}
      <rect x={400} y={0} width={36} height={MAP_HEIGHT}
        fill="url(#corr-shadow-from-l)" />
      <rect x={424} y={0} width={36} height={MAP_HEIGHT}
        fill="url(#corr-shadow-from-r)" />
      {/* Right vertical corridor (x 720-780) */}
      <rect x={720} y={0} width={36} height={MAP_HEIGHT}
        fill="url(#corr-shadow-from-l)" />
      <rect x={744} y={0} width={36} height={MAP_HEIGHT}
        fill="url(#corr-shadow-from-r)" />
      {/* Horizontal corridor (y 300-380) */}
      <rect x={0} y={300} width={MAP_WIDTH} height={30}
        fill="url(#corr-shadow-from-t)" />
      <rect x={0} y={350} width={MAP_WIDTH} height={30}
        fill="url(#corr-shadow-from-b)" />

      {/* ── 10. Surface grain (subtle dither → material / premium feel) ─────── */}
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#surface-grain)" />

      {/* ── 11. Room accent inner borders (subtle color outline) ─────────────── */}
      {ROOM_LAYOUTS.map((r) => {
        const cfg = ROOM_VISUAL[r.id]
        if (!cfg) return null
        return (
          <rect
            key={`accborder-${r.id}`}
            x={r.x + 0.5} y={r.y + 0.5}
            width={r.width - 1} height={r.height - 1}
            fill="none"
            stroke={cfg.glow}
            strokeWidth="1"
            opacity="0.16"
            rx="1"
          />
        )
      })}

      {/* ── 12. Architectural wall lines (corridor/room boundaries) ────────── */}
      {/* Room outer boundary lines */}
      <line x1={40}   y1={40}  x2={1160} y2={40}   stroke="#B4ACA0" strokeWidth="2" />
      <line x1={40}   y1={660} x2={1160} y2={660}   stroke="#B4ACA0" strokeWidth="2" />
      <line x1={40}   y1={40}  x2={40}   y2={660}   stroke="#B4ACA0" strokeWidth="2" />
      <line x1={1160} y1={40}  x2={1160} y2={660}   stroke="#B4ACA0" strokeWidth="2" />
      {/* Corridor walls (interior) */}
      <line x1={400}  y1={40}  x2={400}  y2={660}   stroke="#B8B0A4" strokeWidth="1.5" opacity="0.85" />
      <line x1={460}  y1={40}  x2={460}  y2={660}   stroke="#B8B0A4" strokeWidth="1.5" opacity="0.85" />
      <line x1={720}  y1={40}  x2={720}  y2={660}   stroke="#B8B0A4" strokeWidth="1.5" opacity="0.85" />
      <line x1={780}  y1={40}  x2={780}  y2={660}   stroke="#B8B0A4" strokeWidth="1.5" opacity="0.85" />
      <line x1={40}   y1={300} x2={1160} y2={300}   stroke="#B8B0A4" strokeWidth="1.5" opacity="0.85" />
      <line x1={40}   y1={380} x2={1160} y2={380}   stroke="#B8B0A4" strokeWidth="1.5" opacity="0.85" />
      {/* Inner accent (faint wall highlight) */}
      <line x1={40}   y1={41}  x2={1160} y2={41}    stroke="#D0C8BC" strokeWidth="0.5" opacity="0.7" />
      <line x1={40}   y1={301} x2={1160} y2={301}   stroke="#D0C8BC" strokeWidth="0.5" opacity="0.65" />
      <line x1={40}   y1={381} x2={1160} y2={381}   stroke="#D0C8BC" strokeWidth="0.5" opacity="0.65" />

      {/* ── 13. Outer office frame (40px margin, slightly darker warm tone) ── */}
      <rect x={0} y={0} width={MAP_WIDTH} height={40}         fill="#C4BAA8" />
      <rect x={0} y={660} width={MAP_WIDTH} height={40}       fill="#C4BAA8" />
      <rect x={0} y={0} width={40} height={MAP_HEIGHT}        fill="#C4BAA8" />
      <rect x={1160} y={0} width={40} height={MAP_HEIGHT}     fill="#C4BAA8" />
      {/* Frame inner highlight */}
      <rect x={40} y={40} width={MAP_WIDTH - 80} height={MAP_HEIGHT - 80}
        fill="none" stroke="#D4CCB8" strokeWidth="1" opacity="0.6" />

      {/* ── 14. 3D Pillars ────────────────────────────────────────────────── */}
      {PILLARS.map((p) => (
        <g key={p.id}>
          {/* Cast shadow (offset 3px south-east, blurred look via opacity layers) */}
          <circle cx={p.cx + 4} cy={p.cy + 4} r={p.r + 2} fill="#000" opacity="0.18" />
          <circle cx={p.cx + 2} cy={p.cy + 2} r={p.r + 1} fill="#000" opacity="0.10" />
          {/* Pillar base ring */}
          <circle cx={p.cx} cy={p.cy} r={p.r + 3} fill="#D4CEBC" stroke="#C0B8A8" strokeWidth="1" />
          {/* Pillar body */}
          <circle cx={p.cx} cy={p.cy} r={p.r} fill="#C8C4B4" stroke="#B8B0A4" strokeWidth="1.2" />
          {/* Top-left highlight (light source = top-left) */}
          <circle cx={p.cx - 2.5} cy={p.cy - 2.5} r={p.r * 0.50} fill="white" opacity="0.22" />
          {/* Center subtle shadow (material depth) */}
          <circle cx={p.cx} cy={p.cy} r={3} fill="#000" opacity="0.08" />
        </g>
      ))}

      {/* ── 15. Map vignette (edge darkening → eye drawn to center) ──────────── */}
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#map-vignette)" />

      {/* ── 16. Corridor centerlines + labels ─────────────────────────────── */}
      {/* Horizontal corridor center */}
      <line x1={40} y1={340} x2={1160} y2={340}
        stroke="#B8B0A4" strokeWidth="0.5" strokeDasharray="10 10" opacity="0.50" />
      {/* Vertical corridor centers */}
      <line x1={430} y1={40} x2={430} y2={660}
        stroke="#B4ACA0" strokeWidth="0.5" strokeDasharray="10 10" opacity="0.42" />
      <line x1={750} y1={40} x2={750} y2={660}
        stroke="#B4ACA0" strokeWidth="0.5" strokeDasharray="10 10" opacity="0.42" />

      {/* Corridor label */}
      <text x={430} y={347} textAnchor="middle"
        fontSize="8" fill="#9A9288"
        fontFamily="'SF Mono', ui-monospace, monospace"
        letterSpacing="0.14em" fontWeight="600">
        CORREDOR
      </text>

      {/* ── 17. Compass (bottom-right) ──────────────────────────────────────── */}
      <g transform={`translate(${MAP_WIDTH - 52}, ${MAP_HEIGHT - 52})`} opacity="0.28">
        <circle cx={16} cy={16} r={15}
          fill="#D8D2C4" stroke="#C4BCAC" strokeWidth="1" />
        <line x1={16} y1={4}  x2={16} y2={28} stroke="#A8A090" strokeWidth="1.2" />
        <line x1={4}  y1={16} x2={28} y2={16} stroke="#A8A090" strokeWidth="1.2" />
        <text x={16} y={10.5} textAnchor="middle"
          fontSize="6" fill="#8A8278"
          fontFamily="system-ui, sans-serif" fontWeight="800">N</text>
      </g>

      {/* ── 18. Scale bar (bottom-left) ─────────────────────────────────────── */}
      <g transform="translate(56, 676)" opacity="0.30">
        <line x1={0} y1={0} x2={60} y2={0} stroke="#A8A090" strokeWidth="1.2" />
        <line x1={0}  y1={-4} x2={0}  y2={4} stroke="#A8A090" strokeWidth="1.2" />
        <line x1={60} y1={-4} x2={60} y2={4} stroke="#A8A090" strokeWidth="1.2" />
        <text x={30} y={-7} textAnchor="middle"
          fontSize="7" fill="#9A9288"
          fontFamily="'SF Mono', ui-monospace, monospace" fontWeight="600">60u</text>
      </g>

    </svg>
  )
}
