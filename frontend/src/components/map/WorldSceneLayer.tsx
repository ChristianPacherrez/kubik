'use client'

// WorldSceneLayer — SVG illustrated overlay sobre el canvas de Kubik
//
// Propósito: Transformar el mapa de "cajas técnicas" a una oficina viva con
// personalidad, props ilustrados, profundidad y animaciones ambientales.
//
// Arquitectura:
//   · SVG 1920×1280 (mismo sistema de coordenadas que canvas-office.ts)
//   · Se coloca SOBRE el canvas (z-index:1) y BAJO los avatares (z-index:2+)
//   · pointer-events:none — no interfiere con movimiento ni zoom
//   · Animaciones CSS via clases de globals.css (anim-plant, anim-monitor, etc.)
//   · Cada sala = componente function aislado con sus props ilustrados
//
// El canvas sigue dibujando: suelos, paredes, gradientes de luz ambiental.
// Este layer añade: muebles ilustrados, depth, micro-props, carácter visual.

// ─── Helper Types ─────────────────────────────────────────────────────────────

interface XY  { x: number; y: number }
interface Box { x: number; y: number; w: number; h: number }

// ─── Color Palette ────────────────────────────────────────────────────────────
// Paleta "Modern Cozy Office" — cálida, luminosa, con personalidad

const C = {
  // Maderas
  woodMaple:   '#D4A96A',
  woodMapleD:  '#B8873E',
  woodWalnut:  '#7C5B3A',
  woodWalnutD: '#5A3E22',
  woodLight:   '#E8D5A8',

  // Tapicería
  sofaIndigo:  '#6B7ECC',
  sofaIndigoD: '#4A5BA8',
  sofaOrange:  '#E07B45',
  sofaOrangeD: '#C4602A',
  sofaGreen:   '#5BA87C',
  sofaGreenD:  '#3D8460',
  sofaTeal:    '#4A9BAA',
  sofaTealD:   '#2E7888',
  cushionCream:'#F2EDE0',
  cushionPeach:'#F4C49E',

  // Plantas
  leafDark:    '#2D6B42',
  leafMid:     '#3D8A56',
  leafLight:   '#5AAF74',
  leafHigh:    '#7DCB8E',
  pot:         '#C47B52',
  potD:        '#A45A35',
  soil:        '#6B4226',

  // Tech
  screenBlue:  '#1A3A5C',
  screenGlow:  '#2D6BA8',
  screenLight: '#4A9FD4',
  keyGray:     '#B0B8C8',
  rackDark:    '#2A2D35',

  // Accents
  white:       '#FAFAF8',
  cream:       '#F5F0E8',
  paper:       '#EDE8DC',
  glassBlue:   'rgba(160,200,240,0.22)',
  glassTint:   'rgba(200,215,240,0.15)',
  shadow:      'rgba(80,60,40,0.14)',
  shadowD:     'rgba(40,30,20,0.22)',

  // Marca
  kubikViolet: '#7C3AED',
  kubikPurple: '#6D28D9',
  accentAmber: '#F59E0B',
  accentTeal:  '#14B8A6',
  accentRose:  '#F43F5E',
}

// ─── Primitive Components ─────────────────────────────────────────────────────

/** Sombra bajo objeto (ellipse difusa) */
function Shadow({ cx, cy, rx = 20, ry = 5, opacity = 0.18 }: {
  cx: number; cy: number; rx?: number; ry?: number; opacity?: number
}) {
  return (
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
      fill={`rgba(40,30,20,${opacity})`} />
  )
}

/** Planta con animación de balanceo */
function Plant({ x, y, r = 18, delay = '0s', color = C.leafMid }: {
  x: number; y: number; r?: number; delay?: string; color?: string
}) {
  const px = x
  const py = y
  const pr = Math.round(r * 0.45)
  return (
    <g>
      <Shadow cx={px} cy={py + r + 2} rx={pr + 2} ry={4} opacity={0.15} />
      {/* Maceta */}
      <path
        d={`M${px - pr} ${py + r * 0.5} Q${px - pr - 2} ${py + r + 4} ${px - pr + 4} ${py + r + 6} L${px + pr - 4} ${py + r + 6} Q${px + pr + 2} ${py + r + 4} ${px + pr} ${py + r * 0.5} Z`}
        fill={C.pot}
      />
      <rect x={px - pr + 2} y={py + r * 0.45} width={(pr - 2) * 2} height={4} rx={1} fill={C.potD} opacity={0.6} />
      {/* Tierra */}
      <ellipse cx={px} cy={py + r * 0.52} rx={pr - 1} ry={3} fill={C.soil} />
      {/* Follaje — capas animadas */}
      <g className="anim-plant" style={{ transformOrigin: `${px}px ${py + r * 0.5}px`, animationDelay: delay }}>
        {/* Capa trasera (oscura) */}
        <circle cx={px - r * 0.3} cy={py + r * 0.05} r={r * 0.55} fill={C.leafDark} opacity={0.85} />
        <circle cx={px + r * 0.3} cy={py - r * 0.1} r={r * 0.50} fill={C.leafDark} opacity={0.80} />
        {/* Capa media */}
        <circle cx={px}          cy={py - r * 0.2} r={r * 0.62} fill={color} />
        <circle cx={px - r * 0.4} cy={py + r * 0.1} r={r * 0.45} fill={color} opacity={0.9} />
        {/* Capa frontal (brillo) */}
        <circle cx={px - r * 0.15} cy={py - r * 0.35} r={r * 0.38} fill={C.leafLight} opacity={0.85} />
        <circle cx={px + r * 0.25} cy={py - r * 0.1}  r={r * 0.3}  fill={C.leafHigh}  opacity={0.7} />
      </g>
    </g>
  )
}

/** Sofá horizontal con brazos, respaldo y cojines */
function Sofa({ x, y, w, h, color = C.sofaIndigo, colorD = C.sofaIndigoD, facing = 'south' }: {
  x: number; y: number; w: number; h: number
  color?: string; colorD?: string; facing?: 'south' | 'north' | 'east' | 'west'
}) {
  const d = 0 // unused facing for now
  const armW  = Math.min(w * 0.12, 16)
  const backH = h * 0.38
  const seatH = h * 0.48
  const legH  = h * 0.14
  const seatY = y + backH
  const legY  = seatY + seatH

  // Cojines — divide el asiento en 2 o 3 según el ancho
  const numCushions = w > 140 ? 3 : 2
  const innerW = w - armW * 2
  const cushW  = innerW / numCushions - 4

  return (
    <g>
      <Shadow cx={x + w / 2} cy={legY + legH + 2} rx={w * 0.45} ry={6} />
      {/* Patas */}
      <rect x={x + armW + 4}     y={legY} width={8}  height={legH} rx={2} fill={C.woodWalnut} />
      <rect x={x + w - armW - 12} y={legY} width={8}  height={legH} rx={2} fill={C.woodWalnut} />
      {/* Respaldo */}
      <rect x={x} y={y} width={w} height={backH + 6} rx={6} fill={colorD} />
      <rect x={x + 3} y={y + 3} width={w - 6} height={backH} rx={4} fill={color} />
      {/* Brazos */}
      <rect x={x}             y={y + backH * 0.2} width={armW}  height={seatH + backH * 0.5} rx={4} fill={colorD} />
      <rect x={x + w - armW}  y={y + backH * 0.2} width={armW}  height={seatH + backH * 0.5} rx={4} fill={colorD} />
      {/* Asiento */}
      <rect x={x + armW} y={seatY} width={innerW} height={seatH} rx={3} fill={color} />
      {/* Cojines */}
      {Array.from({ length: numCushions }).map((_, i) => {
        const cx = x + armW + 2 + i * (cushW + 4)
        return (
          <g key={i}>
            <rect x={cx} y={seatY + 3} width={cushW} height={seatH - 6} rx={4}
              fill={C.cushionCream} opacity={0.72} />
            {/* Línea de costura */}
            <line x1={cx + 2} y1={seatY + seatH * 0.5} x2={cx + cushW - 2} y2={seatY + seatH * 0.5}
              stroke="rgba(80,60,40,0.12)" strokeWidth={1} />
          </g>
        )
      })}
      {/* Reflejo/luz en respaldo */}
      <rect x={x + armW + 4} y={y + 5} width={w - armW * 2 - 8} height={4} rx={2}
        fill="rgba(255,255,255,0.22)" />
    </g>
  )
}

/** Mesa redonda con tapa de cristal */
function RoundTable({ cx, cy, r = 28 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <Shadow cx={cx} cy={cy + r + 4} rx={r * 0.85} ry={6} />
      {/* Pata central */}
      <line x1={cx} y1={cy} x2={cx} y2={cy + r + 2} stroke={C.woodMapleD} strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={cx} cy={cy + r + 3} rx={10} ry={4} fill={C.woodMapleD} />
      {/* Tapa cristal */}
      <circle cx={cx} cy={cy} r={r} fill={C.glassBlue} stroke={C.sofaTeal} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.08)" />
      {/* Reflejo */}
      <ellipse cx={cx - r * 0.25} cy={cy - r * 0.25} rx={r * 0.35} ry={r * 0.2}
        fill="rgba(255,255,255,0.25)" transform={`rotate(-30,${cx - r * 0.25},${cy - r * 0.25})`} />
    </g>
  )
}

/** Mesa de conferencia rectangular */
function ConfTable({ x, y, w, h, color = C.woodMaple }: Box & { color?: string }) {
  return (
    <g>
      <Shadow cx={x + w / 2} cy={y + h + 6} rx={w * 0.45} ry={7} />
      {/* Patas */}
      {[[x + 12, y + h - 4], [x + w - 20, y + h - 4]].map(([px, py], i) => (
        <rect key={i} x={px} y={py} width={8} height={10} rx={2} fill={C.woodWalnut} />
      ))}
      {/* Superficie */}
      <rect x={x} y={y} width={w} height={h} rx={6} fill={C.woodMapleD} />
      <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx={5} fill={color} />
      {/* Veta de madera */}
      <line x1={x + 8} y1={y + h * 0.35} x2={x + w - 8} y2={y + h * 0.32}
        stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={x + 8} y1={y + h * 0.6}  x2={x + w - 8} y2={y + h * 0.58}
        stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeLinecap="round" />
      {/* Reflejo de luz */}
      <rect x={x + 8} y={y + 4} width={w * 0.4} height={4} rx={2}
        fill="rgba(255,255,255,0.28)" />
    </g>
  )
}

/** Escritorio con monitor */
function Desk({ x, y, w = 80, h = 50, screenColor = C.screenBlue, showMonitor = true }: {
  x: number; y: number; w?: number; h?: number; screenColor?: string; showMonitor?: boolean
}) {
  const mw  = w * 0.44
  const mh  = h * 0.70
  const mx  = x + (w - mw) / 2
  const my  = y - mh - 4
  return (
    <g>
      <Shadow cx={x + w / 2} cy={y + h + 4} rx={w * 0.42} ry={5} />
      {/* Patas */}
      <rect x={x + 6}     y={y + h - 6} width={6} height={10} rx={2} fill={C.woodWalnutD} />
      <rect x={x + w - 12} y={y + h - 6} width={6} height={10} rx={2} fill={C.woodWalnutD} />
      {/* Superficie */}
      <rect x={x} y={y} width={w} height={h} rx={4} fill={C.woodMapleD} />
      <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx={3} fill={C.woodMaple} />
      <rect x={x + 6} y={y + 4} width={w * 0.35} height={3} rx={1}
        fill="rgba(255,255,255,0.22)" />
      {/* Teclado */}
      <rect x={x + w * 0.18} y={y + h * 0.55} width={w * 0.44} height={h * 0.28} rx={2}
        fill={C.keyGray} opacity={0.85} />
      {/* Ratón */}
      <ellipse cx={x + w * 0.78} cy={y + h * 0.65} rx={5} ry={6.5}
        fill={C.keyGray} opacity={0.9} />
      {showMonitor && (
        <g>
          {/* Soporte monitor */}
          <rect x={mx + mw * 0.4} y={my + mh} width={mw * 0.2} height={6} rx={1}
            fill={C.rackDark} />
          <rect x={mx + mw * 0.28} y={my + mh + 5} width={mw * 0.44} height={4} rx={2}
            fill={C.rackDark} />
          {/* Marco */}
          <rect x={mx} y={my} width={mw} height={mh} rx={4} fill={C.rackDark} />
          {/* Pantalla con glow */}
          <rect x={mx + 3} y={my + 3} width={mw - 6} height={mh - 8} rx={2}
            fill={screenColor} className="anim-monitor" />
          {/* Líneas de código simuladas */}
          {[0.2, 0.38, 0.52, 0.66, 0.80].map((ratio, i) => (
            <rect key={i}
              x={mx + 6} y={my + 3 + (mh - 8) * ratio}
              width={(mw - 12) * (0.4 + Math.sin(i * 1.7) * 0.3)} height={2}
              rx={1} fill={C.screenLight} opacity={0.45} />
          ))}
        </g>
      )}
    </g>
  )
}

/** Silla de oficina */
function Chair({ x, y, w = 28, h = 28, color = C.rackDark, facing = 'south' }: {
  x: number; y: number; w?: number; h?: number; color?: string; facing?: string
}) {
  return (
    <g>
      <Shadow cx={x + w / 2} cy={y + h + 2} rx={w * 0.42} ry={4} opacity={0.15} />
      {/* Ruedas */}
      {[[-2, h + 1], [w + 2, h + 1], [w / 2, h + 4]].map(([dx, dy], i) => (
        <circle key={i} cx={x + dx} cy={y + dy} r={3} fill="#888" opacity={0.5} />
      ))}
      {/* Respaldo */}
      {facing !== 'north' && (
        <rect x={x + 2} y={y} width={w - 4} height={h * 0.55} rx={4} fill={color} />
      )}
      {/* Asiento */}
      <rect x={x} y={y + (facing === 'north' ? 0 : h * 0.42)}
        width={w} height={h * 0.52} rx={4} fill={color} />
      {/* Luz en asiento */}
      <rect x={x + 4} y={y + (facing === 'north' ? 3 : h * 0.45)}
        width={w * 0.5} height={3} rx={1.5} fill="rgba(255,255,255,0.16)" />
    </g>
  )
}

/** Estantería con libros */
function Shelf({ x, y, w, h }: Box) {
  const numShelves = Math.floor(h / 36)
  const bookColors = ['#E07B45','#6B7ECC','#5BA87C','#F59E0B','#F43F5E','#14B8A6','#7C3AED','#D4A96A']
  return (
    <g>
      <Shadow cx={x + w / 2} cy={y + h + 3} rx={w * 0.45} ry={5} />
      {/* Estructura */}
      <rect x={x} y={y} width={w} height={h} rx={3} fill={C.woodWalnut} />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={2} fill={C.woodLight} />
      {/* Estantes horizontales */}
      {Array.from({ length: numShelves + 1 }).map((_, i) => (
        <rect key={i} x={x + 2} y={y + (h / (numShelves + 1)) * i + h / (numShelves + 1) - 3}
          width={w - 4} height={4} rx={1} fill={C.woodMapleD} opacity={0.7} />
      ))}
      {/* Libros */}
      {Array.from({ length: numShelves }).map((_, si) => {
        const shelfY = y + (h / (numShelves + 1)) * si + 5
        const shelfH = h / (numShelves + 1) - 12
        let bx = x + 5
        const books = []
        let bi = 0
        while (bx < x + w - 10) {
          const bw = 7 + Math.floor(Math.sin((si * 7 + bi) * 1.3) * 3 + 3)
          const bh = shelfH * (0.6 + Math.sin((si * 5 + bi) * 2.1) * 0.2)
          books.push(
            <rect key={bi} x={bx} y={shelfY + (shelfH - bh)}
              width={bw - 1} height={bh} rx={1}
              fill={bookColors[(si * 3 + bi) % bookColors.length]}
              opacity={0.88} />
          )
          bx += bw
          bi++
        }
        return <g key={si}>{books}</g>
      })}
    </g>
  )
}

/** Ventana con luz solar */
function Window({ x, y, w, h }: Box) {
  return (
    <g>
      {/* Marco exterior */}
      <rect x={x} y={y} width={w} height={h} rx={4} fill="rgba(200,215,240,0.25)" stroke="rgba(180,200,230,0.6)" strokeWidth={2} />
      {/* Vidrio */}
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={2} fill="rgba(210,228,255,0.30)" />
      {/* Cruz divisora */}
      <line x1={x + w / 2} y1={y + 3} x2={x + w / 2} y2={y + h - 3}
        stroke="rgba(180,200,230,0.7)" strokeWidth={2.5} />
      <line x1={x + 3} y1={y + h * 0.45} x2={x + w - 3} y2={y + h * 0.45}
        stroke="rgba(180,200,230,0.7)" strokeWidth={2.5} />
      {/* Brillo de luz solar */}
      <rect x={x + 4} y={y + 4} width={w * 0.45} height={h * 0.38} rx={2}
        fill="rgba(255,248,220,0.35)" />
      {/* Haz de luz (shaft) */}
      <path
        d={`M${x + w * 0.3} ${y + h} L${x + w * 0.15} ${y + h + 80} L${x + w * 0.55} ${y + h + 80} L${x + w * 0.7} ${y + h} Z`}
        fill="rgba(255,240,180,0.07)"
      />
    </g>
  )
}

/** Pizarrón / Whiteboard */
function Whiteboard({ x, y, w, h, lines = true }: Box & { lines?: boolean }) {
  return (
    <g>
      {/* Marco */}
      <rect x={x} y={y} width={w} height={h} rx={3} fill="#C8B89A" />
      {/* Superficie blanca */}
      <rect x={x + 4} y={y + 4} width={w - 8} height={h - 10} rx={2} fill="#FAFAF6" />
      {/* Riel de marcadores */}
      <rect x={x + 4} y={y + h - 7} width={w - 8} height={5} rx={1} fill="#B0A898" />
      {lines && (
        <g opacity={0.55}>
          {/* Diagram lines */}
          <rect x={x + 12} y={y + 12} width={w * 0.3} height={12} rx={2} fill="#6B7ECC" opacity={0.7} />
          <rect x={x + 12 + w * 0.4} y={y + 12} width={w * 0.28} height={12} rx={2} fill="#5BA87C" opacity={0.7} />
          <line x1={x + 12 + w * 0.3} y1={y + 18} x2={x + 12 + w * 0.4} y2={y + 18}
            stroke="#888" strokeWidth={1.5} markerEnd="url(#arrow)" />
          {/* Lines */}
          {[0.38, 0.50, 0.60, 0.70].map((r, i) => (
            <line key={i}
              x1={x + 12} y1={y + h * r}
              x2={x + 12 + (w - 20) * (0.5 + Math.sin(i * 1.9) * 0.3)} y2={y + h * r}
              stroke={['#E07B45','#6B7ECC','#5BA87C','#888'][i]} strokeWidth={1.5}
              strokeLinecap="round" opacity={0.75} />
          ))}
          {/* Post-its */}
          <rect x={x + w - 40} y={y + 14} width={22} height={18} rx={2} fill="#FDE68A" />
          <rect x={x + w - 15} y={y + 10} width={22} height={18} rx={2} fill="#A7F3D0" />
          <rect x={x + w - 30} y={y + 36} width={22} height={18} rx={2} fill="#FCA5A5" />
        </g>
      )}
    </g>
  )
}

/** Máquina de café con vapor */
function CoffeeMachine({ x, y }: XY) {
  return (
    <g>
      <Shadow cx={x + 18} cy={y + 56} rx={16} ry={5} />
      {/* Cuerpo */}
      <rect x={x} y={y + 8} width={36} height={44} rx={5} fill="#3A3A42" />
      <rect x={x + 2} y={y + 10} width={32} height={40} rx={4} fill="#4A4A54" />
      {/* Pantalla */}
      <rect x={x + 6} y={y + 14} width={24} height={14} rx={3} fill="#1A3A5C" className="anim-monitor" />
      <rect x={x + 8} y={y + 16} width={14} height={3} rx={1} fill="#4A9FD4" opacity={0.7} />
      <rect x={x + 8} y={y + 21} width={10} height={2} rx={1} fill="#4A9FD4" opacity={0.5} />
      {/* Botones */}
      {[0, 1, 2].map(i => (
        <circle key={i} cx={x + 10 + i * 8} cy={y + 35} r={3}
          fill={[C.accentAmber, C.accentTeal, '#888'][i]} opacity={0.9} />
      ))}
      {/* Boquilla */}
      <rect x={x + 12} y={y + 43} width={12} height={6} rx={2} fill="#2A2A32" />
      <rect x={x + 15} y={y + 48} width={6} height={4} rx={1} fill="#222" />
      {/* Vapor */}
      <g className="anim-steam" style={{ transformOrigin: `${x + 18}px ${y + 8}px` }}>
        <path d={`M${x + 14} ${y + 6} Q${x + 12} ${y + 1} ${x + 14} ${y - 4}`}
          stroke="rgba(200,220,255,0.6)" strokeWidth={2} fill="none" strokeLinecap="round" />
        <path d={`M${x + 19} ${y + 4} Q${x + 22} ${y - 1} ${x + 19} ${y - 6}`}
          stroke="rgba(200,220,255,0.5)" strokeWidth={2} fill="none" strokeLinecap="round" />
        <path d={`M${x + 24} ${y + 6} Q${x + 26} ${y + 1} ${x + 23} ${y - 4}`}
          stroke="rgba(200,220,255,0.4)" strokeWidth={2} fill="none" strokeLinecap="round" />
      </g>
    </g>
  )
}

/** Alfombra decorativa */
function Rug({ x, y, w, h, color = 'rgba(107,126,204,0.28)', borderColor = 'rgba(107,126,204,0.55)' }: Box & {
  color?: string; borderColor?: string
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={color} />
      <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={4}
        fill="none" stroke={borderColor} strokeWidth={2} />
      <rect x={x + 10} y={y + 10} width={w - 20} height={h - 20} rx={2}
        fill="none" stroke={borderColor} strokeWidth={1} opacity={0.6} />
    </g>
  )
}

/** Lámpara de pie con glow */
function FloorLamp({ x, y, color = '#FFF3C4' }: XY & { color?: string }) {
  return (
    <g>
      <Shadow cx={x} cy={y + 4} rx={8} ry={3} opacity={0.2} />
      {/* Base */}
      <ellipse cx={x} cy={y + 3} rx={9} ry={4} fill={C.woodMapleD} />
      {/* Palo */}
      <line x1={x} y1={y + 3} x2={x} y2={y - 60} stroke={C.woodMaple} strokeWidth={3} strokeLinecap="round" />
      {/* Pantalla */}
      <path d={`M${x - 18} ${y - 58} Q${x} ${y - 72} ${x + 18} ${y - 58} L${x + 12} ${y - 44} Q${x} ${y - 40} ${x - 12} ${y - 44} Z`}
        fill={color} stroke={C.woodMapleD} strokeWidth={1} />
      {/* Glow ambiental */}
      <radialGradient id={`lamp-glow-${x}`} cx="50%" cy="100%" r="70%">
        <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
        <stop offset="100%" stopColor={color} stopOpacity={0}    />
      </radialGradient>
      <ellipse cx={x} cy={y - 44} rx={40} ry={30}
        fill={`url(#lamp-glow-${x})`} />
    </g>
  )
}

/** Pantalla de TV/presentación */
function Screen({ x, y, w, h, content = 'slides' }: Box & { content?: string }) {
  const screenH = h * 0.7
  return (
    <g>
      <Shadow cx={x + w / 2} cy={y + h + 4} rx={w * 0.4} ry={5} />
      {/* Soporte */}
      <rect x={x + w * 0.4} y={y + screenH} width={w * 0.2} height={h - screenH} rx={2} fill={C.rackDark} />
      <rect x={x + w * 0.28} y={y + h - 5} width={w * 0.44} height={5} rx={2} fill={C.rackDark} />
      {/* Marco */}
      <rect x={x} y={y} width={w} height={screenH} rx={5} fill="#1A1A22" />
      {/* Pantalla */}
      <rect x={x + 4} y={y + 4} width={w - 8} height={screenH - 8} rx={3} fill="#0E1829" className="anim-monitor" />
      {content === 'slides' && (
        <g>
          <rect x={x + 8} y={y + 8} width={w * 0.55} height={(screenH - 16) * 0.3} rx={2}
            fill="#FFFFFF" opacity={0.12} />
          {[0.5, 0.65, 0.78].map((r, i) => (
            <rect key={i} x={x + 8} y={y + (screenH - 16) * r + 6} width={(w - 20) * (0.35 + i * 0.15)} height={3}
              rx={1} fill="#4A9FD4" opacity={0.45} />
          ))}
        </g>
      )}
      {content === 'code' && (
        <g>
          {[0.15, 0.3, 0.45, 0.6, 0.75].map((r, i) => (
            <rect key={i} x={x + 8 + (i % 2) * 8} y={y + (screenH - 8) * r}
              width={(w - 24) * (0.3 + Math.sin(i * 1.4) * 0.25)} height={3}
              rx={1} fill={[C.screenLight, '#5BA87C', '#E07B45', C.screenLight, '#F59E0B'][i]} opacity={0.5} />
          ))}
        </g>
      )}
    </g>
  )
}

/** Maceta de cactus (decorativa) */
function Cactus({ x, y }: XY) {
  return (
    <g>
      <Shadow cx={x} cy={y + 28} rx={10} ry={4} opacity={0.15} />
      <rect x={x - 8} y={y + 16} width={16} height={14} rx={3} fill={C.pot} />
      <rect x={x - 6} y={y + 14} width={12} height={4} rx={1} fill={C.potD} opacity={0.6} />
      <ellipse cx={x} cy={y + 17} rx={6} ry={3} fill={C.soil} />
      <rect x={x - 3} y={y} width={6} height={18} rx={3} fill="#4A8A5C" />
      <rect x={x - 3} y={y + 6} width={10} height={4} rx={3} fill="#4A8A5C" />
      <rect x={x - 7} y={y + 10} width={4} height={7} rx={2} fill="#4A8A5C" />
      <rect x={x - 2} y={y + 1} width={2} height={4} rx={1} fill="#5BAA6C" opacity={0.6} />
    </g>
  )
}

// ─── Room Scenes ──────────────────────────────────────────────────────────────

/** Lobby / Recepción — primera impresión, cálida y espaciosa */
function LobbyScene() {
  // Bounds: x:0, y:0, w:1920, h:272
  return (
    <g id="scene-lobby">
      {/* Alfombra central de bienvenida */}
      <Rug x={740} y={80} w={440} h={150} color="rgba(245,158,11,0.18)" borderColor="rgba(245,158,11,0.45)" />

      {/* ── Cluster izquierdo (salas de espera) ── */}
      <Sofa x={55} y={70} w={160} h={72} color={C.sofaOrange} colorD={C.sofaOrangeD} />
      <Sofa x={55} y={155} w={110} h={68} color={C.sofaOrange} colorD={C.sofaOrangeD} />
      <RoundTable cx={250} cy={148} r={30} />
      <Plant x={42} y={56} r={22} delay="0s" />
      <Plant x={220} y={62} r={16} delay="0.8s" />

      {/* ── Recepción central ── */}
      {/* Mostrador */}
      <g>
        {/* Base del mostrador */}
        <rect x={780} y={90} width={360} height={70} rx={6} fill={C.woodWalnut} />
        <rect x={783} y={88} width={354} height={66} rx={5} fill={C.woodMaple} />
        {/* Frente decorativo */}
        <rect x={780} y={130} width={360} height={30} rx={4} fill={C.woodWalnutD} />
        <rect x={790} y={134} width={70} height={4} rx={2} fill={C.accentAmber} opacity={0.6} />
        <rect x={870} y={134} width={70} height={4} rx={2} fill={C.accentAmber} opacity={0.6} />
        {/* Letrero KUBIK */}
        <rect x={870} y={62} width={180} height={28} rx={6}
          fill={C.kubikViolet} opacity={0.90} />
        <rect x={873} y={65} width={174} height={22} rx={5}
          fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
        {/* Texto simulado */}
        <rect x={890} y={73} width={50} height={8} rx={2} fill="rgba(255,255,255,0.85)" />
        <rect x={948} y={73} width={28} height={8} rx={2} fill={C.accentAmber} opacity={0.85} />
        <rect x={984} y={73} width={48} height={8} rx={2} fill="rgba(255,255,255,0.85}" />
        {/* Monitor recepción */}
        <rect x={900} y={70} width={36} height={24} rx={3} fill={C.rackDark} />
        <rect x={903} y={73} width={30} height={18} rx={2} fill={C.screenBlue} className="anim-monitor" />
        {/* Planta en mostrador */}
        <Cactus x={1065} y={72} />
      </g>

      {/* ── Cluster derecho ── */}
      <Sofa x={1620} y={70} w={155} h={70} color={C.sofaTeal} colorD={C.sofaTealD} />
      <Sofa x={1680} y={148} w={115} h={66} color={C.sofaTeal} colorD={C.sofaTealD} />
      <RoundTable cx={1580} cy={150} r={28} />
      <Plant x={1870} y={55} r={22} delay="0.4s" />
      <Plant x={1620} y={58} r={16} delay="1.2s" />

      {/* ── Ventanas (norte de lobby) ── */}
      {[60, 240, 440, 640, 840, 1040, 1240, 1440, 1640, 1840].map((wx, i) => (
        <Window key={i} x={wx} y={4} w={120} h={42} />
      ))}

      {/* Plantas esquinas inferiores — eliminadas (aisladas sin contexto de muebles) */}

      {/* ── Cartelería lateral (tablones informativos) ── */}
      <rect x={60} y={8} width={60} height={48} rx={3} fill={C.woodMapleD} />
      <rect x={63} y={11} width={54} height={42} rx={2} fill="#F5F0E8" />
      {[14, 22, 30, 38].map((ry, i) => (
        <rect key={i} x={66} y={ry} width={35 + i * 3} height={3} rx={1}
          fill="#888" opacity={0.5} />
      ))}

      <rect x={1800} y={8} width={60} height={48} rx={3} fill={C.woodMapleD} />
      <rect x={1803} y={11} width={54} height={42} rx={2} fill="#F5F0E8" />
      {[14, 22, 30, 38].map((ry, i) => (
        <rect key={i} x={1806} y={ry} width={35 + i * 2} height={3} rx={1}
          fill="#888" opacity={0.5} />
      ))}
    </g>
  )
}

/** Engineering Room — zona de desarrollo, pantallas y energía */
function EngineeringScene() {
  // Bounds: x:0, y:336, w:496, h:440
  const ox = 0; const oy = 336
  return (
    <g id="scene-engineering">
      {/* Rack de servidores (esquina superior izquierda) */}
      <g>
        <rect x={ox + 16} y={oy + 16} width={44} height={80} rx={3} fill={C.rackDark} />
        <rect x={ox + 19} y={oy + 19} width={38} height={74} rx={2} fill="#1E2030" />
        {/* LEDs */}
        {[0,1,2,3,4,5,6].map(i => (
          <g key={i}>
            <rect x={ox + 22} y={oy + 22 + i * 10} width={28} height={6} rx={1} fill="#2A2D35" />
            <circle cx={ox + 24} cy={oy + 25 + i * 10} r={2.5}
              fill={i % 3 === 0 ? C.accentAmber : C.accentTeal}
              className={i % 3 === 0 ? 'anim-led-warn' : 'anim-led-ok'} />
          </g>
        ))}
      </g>

      {/* Whiteboard (pared izquierda) */}
      <Whiteboard x={ox + 72} y={oy + 16} w={160} h={100} />

      {/* Fila delantera de escritorios */}
      <Desk x={ox + 40}  y={oy + 200} w={100} h={52} screenColor="#0E2A1A" />
      <Chair x={ox + 54} y={oy + 258} w={34} h={34} />
      <Desk x={ox + 170} y={oy + 200} w={100} h={52} screenColor="#0E1A2A" />
      <Chair x={ox + 184} y={oy + 258} w={34} h={34} />
      <Desk x={ox + 300} y={oy + 200} w={100} h={52} screenColor="#1A0E2A" />
      <Chair x={ox + 314} y={oy + 258} w={34} h={34} />

      {/* Fila trasera de escritorios */}
      <Desk x={ox + 40}  y={oy + 310} w={100} h={52} />
      <Chair x={ox + 54} y={oy + 310 - 40} w={34} h={34} facing="north" />
      <Desk x={ox + 170} y={oy + 310} w={100} h={52} />
      <Chair x={ox + 184} y={oy + 310 - 40} w={34} h={34} facing="north" />
      <Desk x={ox + 300} y={oy + 310} w={100} h={52} />
      <Chair x={ox + 314} y={oy + 310 - 40} w={34} h={34} facing="north" />

      {/* Estantería */}
      <Shelf x={ox + 420} y={oy + 20} w={60} h={160} />

      {/* Plantas */}
      <Plant x={ox + 460} y={oy + 200} r={22} delay="0.3s" />
      <Plant x={ox + 20}  y={oy + 360} r={18} delay="1.0s" />

      {/* Taza de café en escritorios */}
      <ellipse cx={ox + 148} cy={oy + 210} rx={5} ry={5}
        fill={C.pot} opacity={0.7} />
      <ellipse cx={ox + 278} cy={oy + 210} rx={5} ry={5}
        fill={C.pot} opacity={0.7} />
    </g>
  )
}

/** Focus Zone — zona silenciosa, cálida, concentración */
function FocusScene() {
  // Bounds: x:560, y:336, w:368, h:440
  const ox = 560; const oy = 336
  return (
    <g id="scene-focus">
      {/* Alfombra central */}
      <Rug x={ox + 30} y={oy + 100} w={308} h={260}
        color="rgba(99,102,241,0.13)" borderColor="rgba(99,102,241,0.38)" />

      {/* Pods de trabajo individual — 2×2 grid */}
      {/* Pod 1 */}
      <g>
        <rect x={ox + 40} y={oy + 120} width={120} height={80} rx={4}
          fill="rgba(200,200,220,0.15)" stroke="rgba(150,150,200,0.3)" strokeWidth={1.5} />
        <Desk x={ox + 50} y={oy + 130} w={90} h={46} screenColor="#1A1028" />
        <Chair x={ox + 70} y={oy + 182} w={32} h={30} color={C.sofaIndigo} />
      </g>
      {/* Pod 2 */}
      <g>
        <rect x={ox + 200} y={oy + 120} width={120} height={80} rx={4}
          fill="rgba(200,200,220,0.15)" stroke="rgba(150,150,200,0.3)" strokeWidth={1.5} />
        <Desk x={ox + 210} y={oy + 130} w={90} h={46} screenColor="#0E1A28" />
        <Chair x={ox + 230} y={oy + 182} w={32} h={30} color={C.sofaIndigo} />
      </g>
      {/* Pod 3 */}
      <g>
        <rect x={ox + 40} y={oy + 270} width={120} height={80} rx={4}
          fill="rgba(200,200,220,0.15)" stroke="rgba(150,150,200,0.3)" strokeWidth={1.5} />
        <Desk x={ox + 50} y={oy + 280} w={90} h={46} screenColor="#281A0E" />
        <Chair x={ox + 70} y={oy + 270 - 36} w={32} h={30} color={C.sofaGreen} facing="north" />
      </g>
      {/* Pod 4 */}
      <g>
        <rect x={ox + 200} y={oy + 270} width={120} height={80} rx={4}
          fill="rgba(200,200,220,0.15)" stroke="rgba(150,150,200,0.3)" strokeWidth={1.5} />
        <Desk x={ox + 210} y={oy + 280} w={90} h={46} screenColor="#1A2808" />
        <Chair x={ox + 230} y={oy + 270 - 36} w={32} h={30} color={C.sofaGreen} facing="north" />
      </g>

      {/* Lámpara de pie central */}
      <FloorLamp x={ox + 184} y={oy + 400} />

      {/* Plantas */}
      <Plant x={ox + 20}  y={oy + 20}  r={24} delay="0.6s" />
      <Plant x={ox + 340} y={oy + 20}  r={24} delay="1.4s" />
      <Plant x={ox + 20}  y={oy + 400} r={18} delay="0.2s" />
      <Plant x={ox + 340} y={oy + 400} r={18} delay="1.8s" />

      {/* "No Noise" cartel */}
      <rect x={ox + 140} y={oy + 22} width={88} height={24} rx={4}
        fill="rgba(99,102,241,0.72)" />
      <rect x={ox + 143} y={oy + 25} width={82} height={18} rx={3}
        fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      {[0.35, 0.55, 0.72].map((r, i) => (
        <rect key={i} x={ox + 148} y={oy + 28 + i * 5} width={60 * r} height={3} rx={1}
          fill="rgba(255,255,255,0.75)" />
      ))}
    </g>
  )
}

/** Meeting Room A — sala de presentación pequeña */
function MeetingAScene() {
  // Bounds: x:992, y:336, w:336, h:220
  const ox = 992; const oy = 336
  return (
    <g id="scene-meeting-a">
      {/* Pantalla de presentación */}
      <Screen x={ox + 20} y={oy + 16} w={120} h={80} content="slides" />

      {/* Mesa redonda central */}
      <RoundTable cx={ox + 210} cy={oy + 118} r={56} />

      {/* Sillas alrededor */}
      {[
        [ox + 183, oy + 60],
        [ox + 248, oy + 60],
        [ox + 285, oy + 100],
        [ox + 285, oy + 145],
        [ox + 248, oy + 180],
        [ox + 183, oy + 180],
        [ox + 142, oy + 145],
        [ox + 142, oy + 100],
      ].map(([cx, cy], i) => (
        <Chair key={i} x={cx - 14} y={cy - 14} w={28} h={28}
          color={[C.sofaIndigo, C.sofaGreen, C.sofaTeal, C.sofaOrange][i % 4]} />
      ))}

      {/* Whiteboard */}
      <Whiteboard x={ox + 160} y={oy + 14} w={150} h={60} />

      {/* Planta */}
      <Plant x={ox + 316} y={oy + 24} r={18} delay="0.7s" />
      <Plant x={ox + 316} y={oy + 185} r={16} delay="1.3s" />
    </g>
  )
}

/** Meeting Room B — sala de conferencias */
function MeetingBScene() {
  // Bounds: x:992, y:556, w:336, h:220
  const ox = 992; const oy = 556
  return (
    <g id="scene-meeting-b">
      {/* Pantalla TV */}
      <Screen x={ox + 16} y={oy + 50} w={100} h={70} content="slides" />

      {/* Mesa de conferencias */}
      <ConfTable x={ox + 80} y={oy + 80} w={200} h={70} color={C.woodWalnut} />

      {/* Sillas — lado norte y sur */}
      {[ox + 90, ox + 130, ox + 170, ox + 210, ox + 250].map((cx, i) => (
        <Chair key={i} x={cx} y={oy + 50} w={28} h={28} color={C.rackDark} />
      ))}
      {[ox + 90, ox + 130, ox + 170, ox + 210, ox + 250].map((cx, i) => (
        <Chair key={i + 5} x={cx} y={oy + 156} w={28} h={28} color={C.rackDark} facing="north" />
      ))}
      {/* Cabeceras */}
      <Chair x={ox + 50} y={oy + 100} w={28} h={28} color={C.sofaTeal} />
      <Chair x={ox + 284} y={oy + 100} w={28} h={28} color={C.sofaTeal} />

      {/* Laptop en mesa */}
      <rect x={ox + 155} y={oy + 98} width={28} height={20} rx={3} fill={C.rackDark} />
      <rect x={ox + 157} y={oy + 100} width={24} height={16} rx={2}
        fill={C.screenBlue} className="anim-monitor" />
      <rect x={ox + 153} y={oy + 117} width={32} height={5} rx={2} fill="#2A2A32" />

      {/* Planta */}
      <Plant x={ox + 316} y={oy + 60} r={18} delay="0.3s" />

      {/* Glow ambiental violeta */}
      <radialGradient id="mtgb-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#7C3AED" stopOpacity={0.09} />
        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0}    />
      </radialGradient>
      <rect x={ox} y={oy} width={336} height={220} fill="url(#mtgb-glow)" />
    </g>
  )
}

/** Lounge — descanso, social, ventanas panorámicas */
function LoungeScene() {
  // Bounds: x:1392, y:336, w:528, h:440
  const ox = 1392; const oy = 336
  return (
    <g id="scene-lounge">
      {/* Ventanas panorámicas (pared norte) */}
      {[ox + 20, ox + 180, ox + 340].map((wx, i) => (
        <Window key={i} x={wx} y={oy + 8} w={140} h={60} />
      ))}

      {/* Alfombra principal */}
      <Rug x={ox + 60} y={oy + 100} w={400} h={280}
        color="rgba(90,168,124,0.15)" borderColor="rgba(90,168,124,0.4)" />

      {/* Sofá L-shape izquierdo */}
      <Sofa x={ox + 80}  y={oy + 120} w={200} h={76} color={C.sofaGreen} colorD={C.sofaGreenD} />
      <Sofa x={ox + 80}  y={oy + 198} w={80}  h={70} color={C.sofaGreen} colorD={C.sofaGreenD} />

      {/* Mesa de centro izquierda */}
      <RoundTable cx={ox + 220} cy={oy + 248} r={38} />

      {/* Sofá derecho */}
      <Sofa x={ox + 320} y={oy + 160} w={175} h={72} color={C.sofaOrange} colorD={C.sofaOrangeD} />
      <Sofa x={ox + 420} y={oy + 236} w={80}  h={68} color={C.sofaOrange} colorD={C.sofaOrangeD} />

      {/* Mesa de centro derecha */}
      <RoundTable cx={ox + 370} cy={oy + 260} r={30} />

      {/* Lámparas de pie */}
      <FloorLamp x={ox + 78}  y={oy + 390} color="#FFF0C0" />
      <FloorLamp x={ox + 500} y={oy + 390} color="#FFF0C0" />

      {/* Cartel/artwork en pared */}
      <rect x={ox + 490} y={oy + 16} width={80} height={68} rx={3} fill={C.woodMapleD} />
      <rect x={ox + 494} y={oy + 20} width={72} height={60} rx={2}
        fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
      {/* Abstract art */}
      <circle cx={ox + 530} cy={oy + 50} r={24}
        fill={C.kubikViolet} opacity={0.6} />
      <circle cx={ox + 520} cy={oy + 44} r={14}
        fill={C.accentAmber} opacity={0.55} />
      <circle cx={ox + 542} cy={oy + 60} r={10}
        fill={C.accentTeal} opacity={0.6} />

      {/* Plantas */}
      <Plant x={ox + 30}  y={oy + 40}  r={26} delay="0.5s" />
      <Plant x={ox + 500} y={oy + 110} r={20} delay="1.0s" />
      <Plant x={ox + 30}  y={oy + 400} r={22} delay="0.8s" />
      <Plant x={ox + 500} y={oy + 400} r={22} delay="1.6s" />

      {/* Revistas / libros en mesa */}
      <rect x={ox + 195} cy={oy + 236} width={28} height={18} rx={2} fill={C.accentAmber} opacity={0.7} />
      <rect x={ox + 226} cy={oy + 234} width={22} height={18} rx={2} fill={C.sofaIndigo} opacity={0.7} />
    </g>
  )
}

/** Cafetería — espacio social, energía, aroma a café */
function CafeteriaScene() {
  // Bounds: x:0, y:840, w:992, h:440
  const ox = 0; const oy = 840
  return (
    <g id="scene-cafeteria">
      {/* ── Mostrador de cafetería (izquierda) ── */}
      <g>
        <rect x={ox + 20} y={oy + 16} width={280} height={64} rx={5} fill={C.woodWalnut} />
        <rect x={ox + 22} y={oy + 18} width={276} height={60} rx={4} fill={C.woodMaple} />
        {/* Frente mostrador */}
        <rect x={ox + 20} y={oy + 56} width={280} height={24} rx={3} fill={C.woodWalnutD} />
        {/* Máquinas de café */}
        <CoffeeMachine x={ox + 40}  y={oy - 36} />
        <CoffeeMachine x={ox + 100} y={oy - 32} />
        <CoffeeMachine x={ox + 160} y={oy - 38} />
        {/* Pasteles / display */}
        <rect x={ox + 214} y={oy + 14} width={72} height={48} rx={4} fill="rgba(200,220,240,0.3)"
          stroke="rgba(180,200,230,0.5)" strokeWidth={1.5} />
        {/* Pasteles simulados */}
        {[[ox+230,oy+28],[ox+250,oy+26],[ox+270,oy+30],[ox+232,oy+44],[ox+255,oy+42]].map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r={7}
            fill={[C.sofaOrange, C.accentAmber, '#F4A261', C.accentRose, C.cushionPeach][i]} opacity={0.85} />
        ))}
        {/* Menú board */}
        <rect x={ox + 300} y={oy + 2} width={80} height={55} rx={3} fill="#2A2A32" />
        <rect x={ox + 303} y={oy + 5} width={74} height={49} rx={2} fill="#1A2030" />
        {[14, 24, 34, 44].map((ry, i) => (
          <rect key={i} x={ox + 307} y={oy + ry} width={50 + i * 3} height={4} rx={1}
            fill="rgba(255,255,255,0.5)" />
        ))}
      </g>

      {/* Suelo de cafetería (baldosa simulada via path) */}
      <Rug x={ox + 30} y={oy + 100} w={930} h={320}
        color="rgba(245,158,11,0.07)" borderColor="rgba(245,158,11,0.22)" />

      {/* ── Mesas bistro — zona central ── */}
      {[
        [ox + 120, oy + 160],
        [ox + 280, oy + 160],
        [ox + 440, oy + 160],
        [ox + 600, oy + 160],
        [ox + 760, oy + 160],
        [ox + 120, oy + 320],
        [ox + 280, oy + 320],
        [ox + 440, oy + 320],
        [ox + 600, oy + 320],
        [ox + 760, oy + 320],
      ].map(([tx, ty], i) => (
        <g key={i}>
          <RoundTable cx={tx + 28} cy={ty + 28} r={28} />
          <Chair x={tx}     y={ty - 32} w={26} h={26} color={C.sofaIndigo} />
          <Chair x={tx + 30} y={ty + 58} w={26} h={26} color={C.sofaOrange} facing="north" />
          <Chair x={tx - 30} y={ty + 8}  w={26} h={26} color={C.sofaGreen} />
          <Chair x={tx + 60} y={ty + 8}  w={26} h={26} color={C.sofaTeal} />
        </g>
      ))}

      {/* ── Rincón lounge (esquina derecha) ── */}
      <Sofa x={ox + 840} y={oy + 120} w={140} h={68} color={C.sofaOrange} colorD={C.sofaOrangeD} />
      <Sofa x={ox + 900} y={oy + 192} w={90}  h={64} color={C.sofaOrange} colorD={C.sofaOrangeD} />
      <RoundTable cx={ox + 880} cy={oy + 260} r={32} />
      <FloorLamp x={ox + 960} y={oy + 400} color="#FFF3C4" />

      {/* ── Plantas ── */}
      <Plant x={ox + 20}  y={oy + 420} r={28} delay="0.3s" />
      <Plant x={ox + 970} y={oy + 20}  r={22} delay="1.2s" />
      <Plant x={ox + 500} y={oy + 420} r={20} delay="0.7s" />
      <Plant x={ox + 900} y={oy + 420} r={22} delay="1.5s" />

      {/* ── Ventanas (pared sur) ── */}
      {[ox + 30, ox + 220, ox + 420, ox + 620, ox + 820].map((wx, i) => (
        <Window key={i} x={wx} y={oy + 390} w={140} h={46} />
      ))}
    </g>
  )
}

/** Collab Space — creatividad, whiteboards, energía colectiva */
function CollabScene() {
  // Bounds: x:992, y:840, w:928, h:440
  const ox = 992; const oy = 840
  return (
    <g id="scene-collab">
      {/* Alfombra */}
      <Rug x={ox + 20} y={oy + 60} w={888} h={360}
        color="rgba(124,58,237,0.10)" borderColor="rgba(124,58,237,0.30)" />

      {/* ── Whiteboards (pared norte) ── */}
      <Whiteboard x={ox + 20}  y={oy + 16} w={200} h={110} />
      <Whiteboard x={ox + 240} y={oy + 16} w={200} h={110} />
      <Whiteboard x={ox + 460} y={oy + 16} w={200} h={110} />

      {/* ── Pantalla TV grande ── */}
      <Screen x={ox + 680} y={oy + 16} w={220} h={115} content="code" />

      {/* ── Cluster de escritorios (zona de trabajo conjunto) ── */}
      {/* Bloque central 2×3 */}
      {[
        [ox + 60,  oy + 170],
        [ox + 180, oy + 170],
        [ox + 300, oy + 170],
        [ox + 60,  oy + 290],
        [ox + 180, oy + 290],
        [ox + 300, oy + 290],
      ].map(([dx, dy], i) => (
        <g key={i}>
          <Desk x={dx} y={dy} w={90} h={50}
            screenColor={['#1A1028','#0E1A28','#0E2A1A','#1A2808','#280E1A','#1A1A08'][i]} />
          <Chair x={dx + 28} y={i < 3 ? dy + 56 : dy - 42} w={32} h={32}
            color={[C.sofaIndigo, C.sofaTeal, C.sofaGreen, C.sofaOrange, C.sofaIndigo, C.sofaTeal][i]}
            facing={i < 3 ? 'south' : 'north'} />
        </g>
      ))}

      {/* ── Rincón sofa (esquina inferior derecha) ── */}
      <Sofa x={ox + 720} y={oy + 200} w={190} h={74} color={C.sofaIndigo} colorD={C.sofaIndigoD} />
      <Sofa x={ox + 840} y={oy + 278} w={80}  h={68} color={C.sofaIndigo} colorD={C.sofaIndigoD} />
      <RoundTable cx={ox + 760} cy={oy + 310} r={36} />

      {/* Estantería lateral */}
      <Shelf x={ox + 880} y={oy + 200} w={42} h={180} />

      {/* ── Plantas ── */}
      <Plant x={ox + 30}  y={oy + 430} r={26} delay="0.4s" />
      <Plant x={ox + 900} y={oy + 430} r={22} delay="1.0s" />
      <Plant x={ox + 450} y={oy + 430} r={20} delay="1.6s" />
      <Plant x={ox + 660} y={oy + 430} r={18} delay="0.8s" />

      {/* ── Glow creativo (violeta suave) ── */}
      <radialGradient id="collab-glow" cx="50%" cy="30%" r="60%">
        <stop offset="0%"   stopColor={C.kubikViolet} stopOpacity={0.08} />
        <stop offset="100%" stopColor={C.kubikViolet} stopOpacity={0}    />
      </radialGradient>
      <rect x={ox} y={oy} width={928} height={440} fill="url(#collab-glow)" />
    </g>
  )
}

// ─── WorldSceneLayer ──────────────────────────────────────────────────────────

export function WorldSceneLayer() {
  return (
    <svg
      viewBox={`0 0 1920 1280`}
      width={1920}
      height={1280}
      style={{
        position:      'absolute',
        top:           0,
        left:          0,
        pointerEvents: 'none',
        zIndex:        1,
        overflow:      'visible',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Sombra suave para objetos */}
        <filter id="wsf-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="rgba(40,30,20,0.18)" />
        </filter>
        <filter id="wsf-shadow-sm" x="-15%" y="-15%" width="130%" height="145%">
          <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="rgba(40,30,20,0.12)" />
        </filter>
        {/* Glow para monitores */}
        <filter id="wsf-screen-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Arrow marker para whiteboard */}
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 Z" fill="#888" opacity={0.6} />
        </marker>
      </defs>

      {/* ── Escenas de sala ─────────────────────────────────────────────── */}
      <LobbyScene />
      <EngineeringScene />
      <FocusScene />
      <MeetingAScene />
      <MeetingBScene />
      <LoungeScene />
      <CafeteriaScene />
      <CollabScene />
    </svg>
  )
}
