'use client'

// RoomAtmosphere — breathing ambient glow overlay per room (Phase 3 Living Office)
//
// Double-div pattern avoids CSS transition/animation conflict on the same property:
//   · outer div  → opacity transition driven by isLive state (React/CSS transition)
//   · inner div  → roomBreath animation via filter:brightness (CSS keyframe)
// No conflict: transition targets 'opacity', animation targets 'filter'.

interface RoomAtmosphereProps {
  roomId:  string
  isLive?: boolean   // true when room has an active session
}

const ROOM_GLOW: Record<string, string> = {
  lobby:     '#F59E0B',
  focus:     '#6366F1',
  meeting:   '#8B5CF6',
  cafeteria: '#10B981',
  collab:    '#06B6D4',
  support:   '#F43F5E',
}

export function RoomAtmosphere({ roomId, isLive = false }: RoomAtmosphereProps) {
  const color = ROOM_GLOW[roomId]
  if (!color) return null

  return (
    <div
      aria-hidden
      style={{
        position:      'absolute',
        inset:         0,
        borderRadius:  'inherit',
        pointerEvents: 'none',
        zIndex:        0,
        // Opacity transition for isLive state — no animation here
        opacity:    isLive ? 1 : 0.45,
        transition: 'opacity 0.8s ease',
      }}
    >
      {/* Inner gradient breathes via brightness — avoids opacity conflict */}
      <div
        style={{
          position:     'absolute',
          inset:        0,
          borderRadius: 'inherit',
          background:   `radial-gradient(ellipse at 50% 0%, ${color}1E 0%, transparent 68%)`,
          animation:    'roomBreath 8s ease-in-out infinite',
        }}
      />
    </div>
  )
}
