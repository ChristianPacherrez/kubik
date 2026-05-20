'use client'

import React from 'react'

// RoomFurniture — decoración SVG top-down por sala (Visual Identity Phase 1)
//
// Estilo: "Warm Modern" — formas geométricas planas, paleta cálida y aireada,
// muebles modernos con personalidad. Se renderiza como capa absoluta dentro de
// RoomNode, detrás del contenido UI.
// Opacity baja cuando sala vacía, más visible cuando ocupada / con sesión.

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface RoomFurnitureProps {
  id:      string
  width:   number
  height:  number
  isEmpty: boolean
}

// ─── Paleta de mobiliario — Warm Modern Office ────────────────────────────────
//
// Principio: muebles de oficina nórdica-moderna. Madera clara, telas suaves,
// plásticos limpios. Nada oscuro excepto monitores (son pantallas) y metal.

const C = {
  // Superficies de escritorio — madera clara de abedul/arce
  deskWarm:     '#E8D5B0',   // escritorio madera cálida (birch/maple)
  deskCool:     '#D8DCE4',   // escritorio cool light grey (standing/tech)
  deskHighlight:'#F4E8CA',   // borde superior iluminado

  // Monitores — bezel oscuro es correcto (son pantallas)
  monitorBody:  '#2E2E3C',   // cuerpo monitor (dark bezel, realistic)
  screenIndigo: '#3B4FCC',   // pantalla activa azul/indigo (vivo)
  screenCyan:   '#0891B2',   // pantalla cyan (collab)
  screenGlow:   '#818CF8',   // highlight pantalla

  // Asientos y sofás — tela nórdica suave
  sofaBase:     '#C8C2DC',   // base sofá (lavender-grey fabric)
  sofaCushion:  '#D4CEEA',   // cojín ligeramente más claro
  sofaBack:     '#B8B2CC',   // respaldo más oscuro
  chairDot:     '#C4BED8',   // silla

  // Plantas — verde natural vibrante
  potColor:     '#C4845A',   // maceta terracota cálida
  plantDark:    '#3A7040',   // follaje oscuro
  plantLight:   '#5AAA5E',   // follaje claro

  // Mesas — madera y cristal
  tableWarm:    '#D8C498',   // mesa madera cálida
  tableCool:    '#C8CCD8',   // mesa cristal/cool

  // Pizarra / whiteboard — superficie blanca real
  whiteboardBg: '#F8F8FC',   // pizarra blanca
  whiteboardSf: '#EEEEFF',   // superficie pizarra (muy sutil azul)

  // Barra de café — madera oscura (contraste intencional)
  coffeeBar:    '#8B6040',   // barra café, madera oscura
  coffeeCtr:    '#A07850',   // mostrador madera media

  // Rack de servidores — metal oscuro (es un rack, es correcto)
  rackBody:     '#2A2A30',
  rackLed:      '#22c55e',

  // Alfombra
  rugColor:     '#C8C0D8',   // alfombra lavanda suave
  rugBorder:    '#B8B0CC',   // borde alfombra

  // Tablón / pizarra
  boardBg:      '#EDE8DC',   // corcho / whiteboard warm
  boardLine:    '#D8D4C4',   // línea separador sutil
}

// ─── Helper: planta decorativa ────────────────────────────────────────────────

function Plant({ x, y, r = 10, animDelay = '0s' }: {
  x: number; y: number; r?: number; animDelay?: string
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Maceta — terracota cálida */}
      <rect
        x={-r * 0.45} y={r * 0.55}
        width={r * 0.9} height={r * 0.65}
        rx={2} fill={C.potColor}
      />
      {/* Rim de maceta */}
      <rect
        x={-r * 0.5} y={r * 0.50}
        width={r} height={r * 0.14}
        rx={1} fill="#B87050" opacity={0.6}
      />
      {/* Foliage — animated sway (pivot at bottom of fill-box) */}
      <g className="anim-plant" style={{ animationDelay: animDelay }}>
        <ellipse cx={0} cy={0} rx={r} ry={r * 0.82} fill={C.plantDark} />
        <ellipse cx={-r * 0.18} cy={-r * 0.22} rx={r * 0.52} ry={r * 0.42} fill={C.plantLight} opacity={0.65} />
        <ellipse cx={r * 0.4} cy={-r * 0.1} rx={r * 0.28} ry={r * 0.22} fill={C.plantLight} opacity={0.40} />
        {/* Brillo hoja */}
        <ellipse cx={-r * 0.05} cy={-r * 0.38} rx={r * 0.18} ry={r * 0.10} fill="white" opacity={0.15} />
      </g>
    </g>
  )
}

// ─── Helper: monitor ─────────────────────────────────────────────────────────

function Monitor({ x, y, w = 22, h = 12, screenColor = C.screenIndigo }: {
  x: number; y: number; w?: number; h?: number; screenColor?: string
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Cuerpo (dark bezel — correcto para monitores) */}
      <rect width={w} height={h} rx={1.5} fill={C.monitorBody} />
      {/* Pantalla — animated glow */}
      <rect x={1.5} y={1.5} width={w - 3} height={h - 3} rx={1} fill={screenColor} opacity={0.85}
        className="anim-monitor" />
      {/* Highlight pantalla */}
      <rect x={2.5} y={2} width={(w - 5) * 0.45} height={2} rx={0.5} fill={C.screenGlow} opacity={0.35} />
      {/* Pie */}
      <rect x={w * 0.38} y={h} width={w * 0.24} height={2} rx={0.5} fill={C.monitorBody} />
    </g>
  )
}

// ─── Helper: escritorio ───────────────────────────────────────────────────────

function Desk({ x, y, w, h = 18, color = C.deskWarm }: {
  x: number; y: number; w: number; h?: number; color?: string
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Sombra suave */}
      <rect x={1.5} y={1.5} width={w} height={h} rx={2.5} fill="#000" opacity={0.10} />
      {/* Superficie */}
      <rect width={w} height={h} rx={2.5} fill={color} />
      {/* Borde iluminado top */}
      <rect width={w} height={2.5} rx={2} fill={C.deskHighlight} opacity={0.55} />
      {/* Frente escritorio (3D hint) */}
      <rect y={h - 2} width={w} height={2} rx={1} fill="#000" opacity={0.06} />
    </g>
  )
}

// ─── Sala: LOBBY (360×260) ───────────────────────────────────────────────────

function LobbyFurniture() {
  return (
    <g>
      {/* Alfombra central — lavanda cálida */}
      <rect x={120} y={150} width={160} height={80} rx={6} fill={C.rugColor} opacity={0.55} />
      <rect x={124} y={154} width={152} height={72} rx={4} fill="none" stroke={C.rugBorder} strokeWidth={1.2} opacity={0.60} />
      {/* Patrón en alfombra */}
      <rect x={140} y={170} width={120} height={42} rx={3} fill="none" stroke={C.rugBorder} strokeWidth={0.5} opacity={0.35} />

      {/* Reception desk — L-shape, birch maple */}
      <Desk x={105} y={18} w={150} h={20} color={C.deskWarm} />
      {/* Return vertical */}
      <rect x={1} y={1} width={22} height={42} rx={2.5} fill="#000" opacity={0.10}
        transform="translate(232, 18)" />
      <rect width={22} height={42} rx={2.5} fill={C.deskWarm}
        transform="translate(232, 18)" />
      <rect width={3} height={42} rx={1} fill={C.deskHighlight} opacity={0.55}
        transform="translate(232, 18)" />
      {/* Monitor recepción */}
      <Monitor x={112} y={21} w={28} h={14} />
      {/* Papeles / clipboard — papel blanco cálido */}
      <rect x={152} y={22} width={18} height={12} rx={1} fill="#F0EAD8" opacity={0.80} />
      <rect x={154} y={24} width={14} height={1.5} rx={0.5} fill="#C8C0A8" opacity={0.4} />
      <rect x={154} y={27} width={10} height={1.5} rx={0.5} fill="#C8C0A8" opacity={0.4} />

      {/* Sofa izquierdo — fabric nórdico */}
      <g transform="translate(16, 208)">
        <rect x={1} y={1} width={82} height={28} rx={5} fill="#000" opacity={0.08} />
        <rect width={82} height={28} rx={5} fill={C.sofaBase} />
        <rect width={82} height={8} rx={5} fill={C.sofaBack} />
        <rect x={4}  y={9} width={34} height={16} rx={3} fill={C.sofaCushion} />
        <rect x={44} y={9} width={34} height={16} rx={3} fill={C.sofaCushion} />
        {/* Piernas del sofá */}
        <rect x={4}  y={25} width={5} height={3} rx={1} fill="#B0A898" opacity={0.5} />
        <rect x={73} y={25} width={5} height={3} rx={1} fill="#B0A898" opacity={0.5} />
      </g>

      {/* Sofa derecho */}
      <g transform="translate(204, 208)">
        <rect x={1} y={1} width={82} height={28} rx={5} fill="#000" opacity={0.08} />
        <rect width={82} height={28} rx={5} fill={C.sofaBase} />
        <rect width={82} height={8} rx={5} fill={C.sofaBack} />
        <rect x={4}  y={9} width={34} height={16} rx={3} fill={C.sofaCushion} />
        <rect x={44} y={9} width={34} height={16} rx={3} fill={C.sofaCushion} />
        <rect x={4}  y={25} width={5} height={3} rx={1} fill="#B0A898" opacity={0.5} />
        <rect x={73} y={25} width={5} height={3} rx={1} fill="#B0A898" opacity={0.5} />
      </g>

      {/* Mesa de café — madera cálida con cristal superior */}
      <rect x={1} y={1} width={48} height={18} rx={4} fill="#000" opacity={0.12}
        transform="translate(216, 186)" />
      <rect width={48} height={18} rx={4} fill={C.tableWarm}
        transform="translate(216, 186)" />
      {/* Cristal superior */}
      <rect x={3} y={3} width={42} height={12} rx={2} fill="white" opacity={0.18}
        transform="translate(216, 186)" />
      {/* Tazas */}
      <circle cx={232} cy={195} r={3} fill="#C07850" opacity={0.7} />
      <circle cx={256} cy={195} r={3} fill="#C07850" opacity={0.6} />

      {/* Plantas — staggered sway delays */}
      <Plant x={340} y={28}  r={16} animDelay="0s"    />
      <Plant x={340} y={236} r={12} animDelay="1.8s"  />
      <Plant x={20}  y={26}  r={11} animDelay="3.2s"  />

      {/* Máquina expendedora — dark body correcto (es una máquina) */}
      <g transform="translate(290, 16)">
        {/* Cuerpo */}
        <rect x={1} y={1} width={42} height={62} rx={3} fill="#000" opacity={0.14} />
        <rect width={42} height={62} rx={3} fill="#2A2A40" />
        {/* Pantalla / display */}
        <rect x={5} y={5} width={32} height={20} rx={2} fill="#0D2040" />
        <rect x={6} y={6} width={30} height={18} rx={1.5} fill="#1060A0" opacity={0.85}
          className="anim-monitor" style={{ '--anim-dur': '5.5s' } as React.CSSProperties} />
        <rect x={7} y={7} width={10} height={3} rx={0.5} fill="white" opacity={0.10} />
        {/* Slots de producto */}
        <rect x={5} y={30} width={14} height={10} rx={1} fill="#363644" />
        <rect x={23} y={30} width={14} height={10} rx={1} fill="#363644" />
        <rect x={5} y={44} width={14} height={10} rx={1} fill="#363644" />
        <rect x={23} y={44} width={14} height={10} rx={1} fill="#363644" />
        {/* Colores de producto — vivos */}
        <rect x={6} y={31} width={12} height={8} rx={0.5} fill="#E11D48" opacity={0.55} />
        <rect x={24} y={31} width={12} height={8} rx={0.5} fill="#0284C7" opacity={0.55} />
        <rect x={6} y={45} width={12} height={8} rx={0.5} fill="#10B981" opacity={0.50} />
        <rect x={24} y={45} width={12} height={8} rx={0.5} fill="#F59E0B" opacity={0.50} />
        {/* Ranura de moneda */}
        <rect x={14} y={56} width={14} height={3} rx={1} fill="#404050" />
        {/* LED de estado */}
        <circle cx={39} cy={58} r={1.5} fill="#06B6D4" className="anim-led-ok" />
        {/* Glow en el suelo */}
        <ellipse cx={21} cy={66} rx={18} ry={3.5} fill="#06B6D4" opacity={0.15}
          className="anim-vending" />
      </g>

      {/* Bulletin board en pared — corcho cálido */}
      <rect x={165} y={10} width={50} height={30} rx={2} fill="#D4C090" />
      <rect x={167} y={12} width={46} height={26} rx={1} fill="#C8B480" opacity={0.5} />
      {/* Post-its decorativos — colores vivos */}
      <rect x={169} y={14} width={11} height={9} rx={1} fill="#F59E0B" opacity={0.70} />
      <rect x={182} y={14} width={11} height={9} rx={1} fill="#6366F1" opacity={0.60} />
      <rect x={195} y={14} width={11} height={9} rx={1} fill="#10B981" opacity={0.60} />
      {/* Líneas de texto */}
      <rect x={169} y={25} width={37} height={2}  rx={1} fill="#A09070" opacity={0.40} />
      <rect x={169} y={29} width={24} height={2}  rx={1} fill="#A09070" opacity={0.30} />
    </g>
  )
}

// ─── Sala: FOCUS (260×260) ───────────────────────────────────────────────────

function FocusFurniture() {
  // 4 pods en esquinas
  const pods = [
    { x: 14, y: 14,  mx: 18, my: 17 },
    { x: 191, y: 14,  mx: 195, my: 17 },
    { x: 14, y: 226, mx: 18, my: 229 },
    { x: 191, y: 226, mx: 195, my: 229 },
  ]
  return (
    <g>
      {/* Divisores sutiles entre pods — lavanda muy sutil */}
      <line x1={130} y1={14}  x2={130} y2={90}  stroke="#C0BCDA" strokeWidth={1} opacity={0.45} strokeDasharray="4 4" />
      <line x1={130} y1={170} x2={130} y2={246} stroke="#C0BCDA" strokeWidth={1} opacity={0.45} strokeDasharray="4 4" />
      <line x1={14}  y1={130} x2={90}  y2={130} stroke="#C0BCDA" strokeWidth={1} opacity={0.45} strokeDasharray="4 4" />
      <line x1={170} y1={130} x2={246} y2={130} stroke="#C0BCDA" strokeWidth={1} opacity={0.45} strokeDasharray="4 4" />

      {/* Pods de escritorio — cool grey minimalista */}
      {pods.map((p, i) => (
        <g key={i}>
          <Desk x={p.x} y={p.y} w={55} h={20} color={C.deskCool} />
          <Monitor x={p.mx} y={p.my} w={20} h={11} />
          {/* Mousepad */}
          <rect x={p.x + 30} y={p.y + 4} width={20} height={12} rx={2} fill="#B8C0CC" opacity={0.5} />
        </g>
      ))}

      {/* Librería central top — madera clara */}
      <rect x={100} y={14} width={60} height={10} rx={2} fill="#D4C8A0" />
      <rect x={102} y={15} width={12} height={8} rx={1} fill="#6366F1" opacity={0.35} />
      <rect x={116} y={15} width={10} height={8} rx={1} fill="#10B981" opacity={0.30} />
      <rect x={128} y={15} width={14} height={8} rx={1} fill="#F59E0B" opacity={0.32} />
      <rect x={144} y={15} width={10} height={8} rx={1} fill="#8B5CF6" opacity={0.28} />

      {/* Lámpara de pie (centro) — moderna */}
      <circle cx={130} cy={130} r={5} fill="#D8D4C8" />
      <circle cx={130} cy={130} r={3} fill="#FBBF24" opacity={0.40} />
      <ellipse cx={130} cy={128} rx={6} ry={2.5} fill="#FBBF24" opacity={0.12} />
      <line x1={130} y1={135} x2={130} y2={150} stroke="#C0B890" strokeWidth={1.5} />
      {/* Base */}
      <ellipse cx={130} cy={151} rx={5} ry={2} fill="#C8C0A8" opacity={0.6} />

      {/* Planta esquina */}
      <Plant x={243} y={243} r={10} animDelay="1.3s" />

      {/* Auriculares colgados en pod 1 */}
      <ellipse cx={56} cy={22} rx={4} ry={3} fill="none" stroke="#8B5CF6" strokeWidth={1} opacity={0.4} />
    </g>
  )
}

// ─── Sala: MEETING (260×280) ─────────────────────────────────────────────────

function MeetingFurniture() {
  // Sillas alrededor de la mesa oval: 6 posiciones
  const chairs = [
    { x: 62,  y: 100 }, { x: 128, y: 82  }, { x: 196, y: 100 },
    { x: 62,  y: 176 }, { x: 128, y: 194 }, { x: 196, y: 176 },
  ]
  return (
    <g>
      {/* Pantalla de pared (top) — TV/proyector */}
      <rect x={45} y={10} width={170} height={14} rx={3} fill={C.monitorBody} />
      <rect x={47} y={12} width={166} height={10} rx={2} fill="#2844CC" opacity={0.7} />
      {/* Presentación en pantalla */}
      <rect x={50} y={13} width={60}  height={4}  rx={1} fill="white" opacity={0.12} />
      <rect x={120} y={13} width={40} height={4}  rx={1} fill="white" opacity={0.08} />
      {/* Brillo pantalla */}
      <rect x={47} y={12} width={30}  height={3}  rx={1} fill="white" opacity={0.05} />

      {/* Sillas — fabric moderno */}
      {chairs.map((c, i) => (
        <g key={i} transform={`translate(${c.x}, ${c.y})`}>
          <rect x={0} y={0} width={14} height={10} rx={3} fill={C.chairDot} />
          <rect x={2} y={2} width={10} height={6}  rx={2} fill={C.sofaCushion} opacity={0.7} />
        </g>
      ))}

      {/* Mesa de conferencia oval — madera clara con vidrio */}
      <ellipse cx={130} cy={138} rx={80} ry={50} fill="#000" opacity={0.10} />
      <ellipse cx={130} cy={137} rx={80} ry={50} fill={C.tableCool} />
      {/* Reflejo superficie vidrio */}
      <ellipse cx={112} cy={122} rx={46} ry={22} fill="white" opacity={0.18} />
      {/* Línea central */}
      <line x1={52} y1={137} x2={208} y2={137} stroke="#B8C0CC" strokeWidth={0.5} opacity={0.45} />
      {/* Borde mesa */}
      <ellipse cx={130} cy={137} rx={80} ry={50} fill="none" stroke="#B0B8C4" strokeWidth={0.8} opacity={0.4} />

      {/* Objetos en la mesa */}
      {/* Laptop */}
      <rect x={98} y={128} width={22} height={14} rx={2} fill={C.monitorBody} />
      <rect x={99} y={129} width={20} height={12} rx={1} fill="#3B5BDB" opacity={0.7} />
      {/* Tazas */}
      <circle cx={155} cy={140} r={4} fill="#D4A870" opacity={0.75} />
      <circle cx={155} cy={140} r={2} fill="#C08050" opacity={0.5} />
      <circle cx={115} cy={150} r={3} fill="#D4A870" opacity={0.65} />
      {/* Agua / vaso */}
      <rect x={168} y={128} width={8} height={12} rx={2} fill="#A0C8E4" opacity={0.45} />

      {/* Whiteboard lateral — blanca real */}
      <rect x={248} y={50} width={8}  height={140} rx={2} fill={C.whiteboardBg} />
      <rect x={249} y={52} width={6}  height={136} rx={1} fill={C.whiteboardSf} opacity={0.6} />
      {/* Líneas en pizarra — azul sutil */}
      <line x1={250} y1={80}  x2={254} y2={80}  stroke="#6366F1" strokeWidth={0.6} opacity={0.30} />
      <line x1={250} y1={100} x2={254} y2={100} stroke="#6366F1" strokeWidth={0.6} opacity={0.28} />
      <line x1={250} y1={120} x2={254} y2={120} stroke="#6366F1" strokeWidth={0.6} opacity={0.25} />
      {/* Marcador en borde pizarra */}
      <rect x={248} y={178} width={3} height={8} rx={1} fill="#6366F1" opacity={0.4} />

      {/* Planta esquina */}
      <Plant x={235} y={260} r={14} animDelay="2.8s" />
    </g>
  )
}

// ─── Sala: CAFETERÍA (360×280) ───────────────────────────────────────────────

function CafeteriaFurniture() {
  const bistroTables = [
    { cx: 130, cy: 80  },
    { cx: 230, cy: 140 },
    { cx: 120, cy: 200 },
  ]
  return (
    <g>
      {/* Barra de café (lateral izquierdo) — madera oscura intencional */}
      <rect x={1} y={1} width={18} height={110} rx={3} fill="#000" opacity={0.12} transform="translate(12, 22)" />
      <rect width={18} height={110} rx={3} fill={C.coffeeBar} transform="translate(12, 22)" />
      <rect width={18} height={6}   rx={2} fill={C.coffeeCtr} transform="translate(12, 22)" />
      {/* Encimera barra */}
      <rect x={10} y={22} width={22} height={4} rx={1} fill="#C8C0A8" opacity={0.5} />

      {/* Máquina de café — acero oscuro */}
      <rect x={14} y={28} width={14} height={18} rx={2} fill="#383830" />
      <circle cx={21} cy={36} r={5} fill="#282820" />
      <circle cx={21} cy={36} r={3} fill="#1A1A18" />
      {/* Cápsula portafiltro */}
      <rect x={17} y={40} width={8} height={3} rx={1} fill="#484840" opacity={0.8} />
      {/* Estantes barra */}
      <rect x={14} y={50} width={14} height={2} rx={0.5} fill="#A08060" opacity={0.7} />
      <rect x={14} y={65} width={14} height={2} rx={0.5} fill="#A08060" opacity={0.7} />
      {/* Tazas — colores de tazas de café */}
      <circle cx={17} cy={57} r={2.2} fill="#E8E0D0" opacity={0.85} />
      <circle cx={25} cy={57} r={2.2} fill="#E8DFD0" opacity={0.75} />
      {/* Vapor de café — blanco etéreo */}
      <ellipse cx={21} cy={24} rx={2.2} ry={1.4} fill="white" className="anim-steam"
        style={{ animationDelay: '0s' }} />
      <ellipse cx={18} cy={22} rx={1.8} ry={1.1} fill="white" className="anim-steam"
        style={{ animationDelay: '0.85s' }} />
      <ellipse cx={24} cy={20} rx={1.5} ry={0.9} fill="white" className="anim-steam"
        style={{ animationDelay: '1.65s' }} />

      {/* Mesas bistro con sillas */}
      {bistroTables.map((t, i) => (
        <g key={i}>
          {/* Sillas (4 posiciones) */}
          <circle cx={t.cx - 22} cy={t.cy}      r={8} fill={C.chairDot} />
          <circle cx={t.cx + 22} cy={t.cy}      r={8} fill={C.chairDot} />
          <circle cx={t.cx}      cy={t.cy - 22} r={8} fill={C.chairDot} />
          <circle cx={t.cx}      cy={t.cy + 22} r={8} fill={C.chairDot} />
          {/* Cojines */}
          <circle cx={t.cx - 22} cy={t.cy}      r={5} fill={C.sofaCushion} opacity={0.6} />
          <circle cx={t.cx + 22} cy={t.cy}      r={5} fill={C.sofaCushion} opacity={0.6} />
          <circle cx={t.cx}      cy={t.cy - 22} r={5} fill={C.sofaCushion} opacity={0.6} />
          <circle cx={t.cx}      cy={t.cy + 22} r={5} fill={C.sofaCushion} opacity={0.6} />
          {/* Mesa */}
          <circle cx={t.cx + 1} cy={t.cy + 1} r={17} fill="#000" opacity={0.08} />
          <circle cx={t.cx}     cy={t.cy}     r={17} fill={C.tableWarm} />
          {/* Cristal superficie */}
          <circle cx={t.cx - 3} cy={t.cy - 3} r={9}  fill="white" opacity={0.15} />
        </g>
      ))}

      {/* Rincón sofá (derecha-abajo) */}
      <g transform="translate(268, 200)">
        <rect x={1} y={1} width={80} height={26} rx={5} fill="#000" opacity={0.08} />
        <rect width={80} height={26} rx={5} fill={C.sofaBase} />
        <rect width={80} height={7}  rx={4} fill={C.sofaBack} />
        <rect x={4}  y={8} width={33} height={15} rx={3} fill={C.sofaCushion} />
        <rect x={43} y={8} width={33} height={15} rx={3} fill={C.sofaCushion} />
        {/* Almohadones decorativos */}
        <rect x={12} y={9} width={10} height={10} rx={2} fill="#8B5CF6" opacity={0.25} />
        <rect x={58} y={9} width={10} height={10} rx={2} fill="#10B981" opacity={0.22} />
      </g>
      {/* Ottoman */}
      <rect x={270} y={228} width={24} height={36} rx={5} fill={C.sofaBase} opacity={0.75} />

      {/* Acuario (pared superior-derecha) */}
      <g transform="translate(268, 14)">
        {/* Tanque — agua azul oscuro (correcto) */}
        <rect width={70} height={42} rx={3} fill="#0A1E30" opacity={0.88} />
        <rect x={1} y={1} width={68} height={40} rx={2} fill="#0D2A42" />
        {/* Agua */}
        <rect x={2} y={2} width={66} height={38} rx={1.5} fill="#082840" opacity={0.85} />
        {/* Brillo superior (glass) */}
        <rect x={2} y={2} width={25} height={5} rx={1} fill="white" opacity={0.08} />
        {/* Pez 1 */}
        <ellipse cx={18} cy={22} rx={5.5} ry={3.2} fill="#06B6D4" opacity={0.80} />
        <ellipse cx={24} cy={22} rx={2.5} ry={1.8} fill="#0E7490" opacity={0.60} />
        {/* Pez 2 */}
        <ellipse cx={50} cy={30} rx={4.5} ry={2.8} fill="#8B5CF6" opacity={0.75} />
        <ellipse cx={55} cy={30} rx={2}   ry={1.5} fill="#7C3AED" opacity={0.55} />
        {/* Pez 3 (pequeño) */}
        <ellipse cx={38} cy={14} rx={3} ry={1.8} fill="#F59E0B" opacity={0.65} />
        {/* Burbujas — flotan desde el fondo */}
        <circle cx={14} cy={34} r={1.5} fill="none" stroke="#06B6D4" strokeWidth={0.6}
          className="anim-bubble"
          style={{ '--bub-dur': '2.2s' } as React.CSSProperties} />
        <circle cx={38} cy={36} r={1.2} fill="none" stroke="#06B6D4" strokeWidth={0.5}
          className="anim-bubble"
          style={{ '--bub-dur': '3.0s', animationDelay: '0.75s' } as React.CSSProperties} />
        <circle cx={60} cy={33} r={1.0} fill="none" stroke="#22D3EE" strokeWidth={0.4}
          className="anim-bubble"
          style={{ '--bub-dur': '2.6s', animationDelay: '1.4s' } as React.CSSProperties} />
        {/* Decoración fondo — algas verdes */}
        <rect x={6}  y={32} width={3}  height={8} rx={1.5} fill="#059669" opacity={0.65} />
        <rect x={58} y={30} width={2.5} height={9} rx={1.2} fill="#059669" opacity={0.58} />
        {/* Arena del fondo */}
        <rect x={2} y={36} width={66} height={4} rx={0} fill="#C8A860" opacity={0.18} />
        {/* Borde del tanque */}
        <rect width={70} height={42} rx={3} fill="none" stroke="#1E4A6A" strokeWidth={1} />
      </g>

      {/* Plantas — staggered sway delays */}
      <Plant x={340} y={20}  r={18} animDelay="0s"   />
      <Plant x={340} y={255} r={13} animDelay="2.1s" />
      <Plant x={50}  y={256} r={10} animDelay="4.0s" />

      {/* Rug bajo sofá */}
      <rect x={242} y={194} width={106} height={76} rx={6} fill={C.rugColor} opacity={0.35} />
      <rect x={245} y={197} width={100} height={70} rx={4} fill="none" stroke={C.rugBorder} strokeWidth={1} opacity={0.45} />
    </g>
  )
}

// ─── Sala: COLLAB / ENGINEERING (380×260) ────────────────────────────────────

function CollabFurniture() {
  const monitorPositions = [22, 64, 106, 148, 190]
  return (
    <g>
      {/* Bench 1 — fila superior de monitores, cool grey */}
      <Desk x={14} y={24} w={220} h={18} color="#CDD1D8" />
      {monitorPositions.map((mx, i) => (
        <Monitor key={`m1-${i}`} x={14 + mx} y={26} w={20} h={11} screenColor={C.screenCyan} />
      ))}

      {/* Bench 2 — segunda fila */}
      <Desk x={14} y={58} w={220} h={18} color="#C8CDD4" />
      {monitorPositions.map((mx, i) => (
        <Monitor key={`m2-${i}`} x={14 + mx} y={60} w={20} h={11} screenColor={C.screenCyan} />
      ))}

      {/* Standing desks (derecha) */}
      <Desk x={255} y={24} w={60} h={18} color="#CDD1D8" />
      <Monitor x={263} y={26} w={22} h={12} screenColor={C.screenIndigo} />
      <Desk x={255} y={58} w={60} h={18} color="#C8CDD4" />
      <Monitor x={263} y={60} w={22} h={12} screenColor={C.screenIndigo} />
      {/* Teclados */}
      <rect x={260} y={39} width={50} height={8} rx={2} fill="#D0D4DC" opacity={0.7} />
      <rect x={260} y={74} width={50} height={8} rx={2} fill="#CCD0D8" opacity={0.7} />

      {/* Pizarra colaborativa (bottom) — whiteboard real */}
      <rect x={1} y={1} width={180} height={14} rx={2} fill="#000" opacity={0.08}
        transform="translate(14, 232)" />
      <rect width={180} height={14} rx={2} fill={C.whiteboardBg}
        transform="translate(14, 232)" />
      <rect x={1} y={1} width={178} height={12} rx={1} fill={C.whiteboardSf} opacity={0.6}
        transform="translate(14, 232)" />
      {/* Diagramas en pizarra — colores vivos */}
      <line x1={40}  y1={236} x2={40}  y2={244} stroke="#B0B8C8" strokeWidth={0.5} opacity={0.5} />
      <line x1={80}  y1={236} x2={80}  y2={244} stroke="#B0B8C8" strokeWidth={0.5} opacity={0.5} />
      <line x1={120} y1={236} x2={120} y2={244} stroke="#B0B8C8" strokeWidth={0.5} opacity={0.5} />
      <circle cx={50}  cy={240} r={3} fill="none" stroke="#06B6D4" strokeWidth={0.6} opacity={0.45} />
      <circle cx={100} cy={240} r={3} fill="none" stroke="#6366F1" strokeWidth={0.6} opacity={0.45} />
      {/* Texto en pizarra */}
      <rect x={15} y={234} width={22} height={2} rx={1} fill="#8B5CF6" opacity={0.30} />
      <rect x={15} y={238} width={16} height={2} rx={1} fill="#8B5CF6" opacity={0.22} />

      {/* Rack de servidores (esquina derecha) — metal oscuro correcto */}
      <rect x={1} y={1} width={20} height={96} rx={2} fill="#000" opacity={0.20}
        transform="translate(354, 82)" />
      <rect width={20} height={96} rx={2} fill={C.rackBody}
        transform="translate(354, 82)" />
      {/* Unidades de rack */}
      {[8, 20, 32, 44, 56, 68, 80].map((ry, i) => (
        <rect key={i} x={355} y={82 + ry} width={18} height={9} rx={1}
          fill="#343438" />
      ))}
      {/* LEDs de estado — animados */}
      <circle cx={358} cy={95}  r={1.5} fill={C.rackLed} className="anim-led-ok"
        style={{ animationDelay: '0s' }} />
      <circle cx={358} cy={115} r={1.5} fill={C.rackLed} className="anim-led-ok"
        style={{ animationDelay: '0.6s' }} />
      <circle cx={358} cy={135} r={1.5} fill="#F59E0B"   className="anim-led-warn"
        style={{ animationDelay: '0.3s' }} />
      <circle cx={358} cy={155} r={1.5} fill={C.rackLed} className="anim-led-ok"
        style={{ animationDelay: '1.1s' }} />

      {/* Planta en esquina */}
      <Plant x={362} y={248} r={12} animDelay="0.9s" />
    </g>
  )
}

// ─── Sala: SUPPORT (380×280) ─────────────────────────────────────────────────

function SupportFurniture() {
  const deskPairs = [
    { x: 14, y: 22, mx: 20, my: 25 },
    { x: 14, y: 56, mx: 20, my: 59 },
    { x: 258, y: 22, mx: 264, my: 25 },
    { x: 258, y: 56, mx: 264, my: 59 },
  ]
  return (
    <g>
      {/* Tablón de estado (centro, pared top) — kanban visual */}
      <rect x={148} y={10} width={84} height={52} rx={3} fill={C.boardBg} />
      <rect x={150} y={12} width={80} height={48} rx={2} fill={C.boardLine} opacity={0.40} />
      {/* Columnas Kanban */}
      <line x1={176} y1={14} x2={176} y2={58} stroke="#C0B8A0" strokeWidth={0.7} opacity={0.55} />
      <line x1={202} y1={14} x2={202} y2={58} stroke="#C0B8A0" strokeWidth={0.7} opacity={0.55} />
      <line x1={228} y1={14} x2={228} y2={58} stroke="#C0B8A0" strokeWidth={0.7} opacity={0.55} />
      {/* Headers de columna */}
      <rect x={151} y={14} width={24} height={5} rx={1} fill="#94A3B8" opacity={0.25} />
      <rect x={177} y={14} width={24} height={5} rx={1} fill="#F59E0B" opacity={0.20} />
      <rect x={203} y={14} width={24} height={5} rx={1} fill="#10B981" opacity={0.20} />
      {/* Tickets — colores vivos sobre fondo claro */}
      <rect x={153} y={22} width={20} height={10} rx={2} fill="#F43F5E" opacity={0.40} />
      <rect x={153} y={35} width={20} height={10} rx={2} fill="#F43F5E" opacity={0.32} />
      <rect x={179} y={22} width={20} height={10} rx={2} fill="#F59E0B" opacity={0.40} />
      <rect x={179} y={36} width={20} height={10} rx={2} fill="#F59E0B" opacity={0.32} />
      <rect x={205} y={22} width={20} height={10} rx={2} fill="#10B981" opacity={0.40} />
      <rect x={231} y={22} width={20} height={10} rx={2} fill="#10B981" opacity={0.32} />

      {/* 4 escritorios en 2 pares — birch maple cálido */}
      {deskPairs.map((p, i) => (
        <g key={i}>
          <Desk x={p.x} y={p.y} w={110} h={18} color={C.deskWarm} />
          <Monitor x={p.mx} y={p.my} w={22} h={12} />
          {/* Objetos de escritorio — papel */}
          <rect x={p.x + 40} y={p.y + 5} width={16} height={10} rx={1}
            fill="#F0EAD8" opacity={0.75} />
          {/* Taza de café */}
          <circle cx={p.x + 95} cy={p.y + 9} r={4} fill="#D4A870" opacity={0.55} />
        </g>
      ))}

      {/* Divisor central entre los 2 pares — madera clara */}
      <rect x={128} y={12} width={4} height={72} rx={1.5} fill="#D4C8A8" opacity={0.55} />

      {/* Fila de plantas (pared inferior) — delays escalonados */}
      <Plant x={35}  y={254} r={10} animDelay="0s"   />
      <Plant x={82}  y={258} r={12} animDelay="1.5s" />
      <Plant x={132} y={254} r={9}  animDelay="3.0s" />
      <Plant x={180} y={258} r={11} animDelay="4.4s" />

      {/* Mat en el suelo — alfombra de entrada */}
      <rect x={14} y={78} width={110} height={8} rx={2} fill={C.rugColor} opacity={0.45} />
      <rect x={258} y={78} width={110} height={8} rx={2} fill={C.rugColor} opacity={0.45} />
    </g>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

const FURNITURE_MAP: Record<string, (w: number, h: number) => React.ReactNode> = {
  lobby:     (w, h) => <LobbyFurniture     />,
  focus:     (w, h) => <FocusFurniture     />,
  meeting:   (w, h) => <MeetingFurniture   />,
  cafeteria: (w, h) => <CafeteriaFurniture />,
  collab:    (w, h) => <CollabFurniture    />,
  support:   (w, h) => <SupportFurniture   />,
}

export function RoomFurniture({ id, width, height, isEmpty }: RoomFurnitureProps) {
  const renderFn = FURNITURE_MAP[id]
  if (!renderFn) return null

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      style={{ opacity: isEmpty ? 0.22 : 0.52 }}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {renderFn(width, height)}
    </svg>
  )
}
