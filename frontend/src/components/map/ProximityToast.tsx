'use client'

// ProximityToast — contextual banner when player approaches an NPC
//
// Mounts at the top-center of the map viewport (overlay, not canvas coords).
// Lingers 600ms after peer exits range to avoid flashing.

import { useState, useEffect } from 'react'
import { usePlayerStore }      from '@/store/player.store'
import { MOCK_USERS }          from '@/lib/mock-data'
import { MOCK_PRESENCE, PRESENCE_LABELS } from '@/lib/presence'
import { STATUS_COLORS }       from '@/types'

const LINGER_MS = 600

export function ProximityToast() {
  const nearbyNpcId = usePlayerStore((s) => s.nearbyNpcId)

  const [displayId, setDisplayId] = useState<string | null>(nearbyNpcId)
  const [visible,   setVisible]   = useState(false)

  useEffect(() => {
    if (nearbyNpcId) {
      setDisplayId(nearbyNpcId)
      setVisible(true)
    } else {
      const t = setTimeout(() => setVisible(false), LINGER_MS)
      return () => clearTimeout(t)
    }
  }, [nearbyNpcId])

  if (!visible || !displayId) return null

  const user = MOCK_USERS.find((u) => u.id === displayId)
  if (!user) return null

  const activity  = MOCK_PRESENCE[displayId] ?? 'idle'
  const label     = PRESENCE_LABELS[activity]
  const dotColor  = STATUS_COLORS[user.status]
  const firstName = user.name.split(' ')[0]

  return (
    <div
      className="absolute top-14 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
      style={{ animation: 'presenceToastIn 0.18s ease-out' }}
    >
      <div className="
        pointer-events-auto
        flex items-center gap-2.5
        bg-[var(--color-bg-primary)]/96
        border border-[var(--color-border-secondary)]
        rounded-2xl pl-3 pr-2 py-2
        shadow-lg backdrop-blur-sm
      ">
        {/* Status dot */}
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />

        {/* Identity */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
            {firstName}
          </span>
          <span className="text-[10px] text-[var(--color-text-quaternary)]">
            está {label}
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-3.5 bg-[var(--color-border-secondary)] flex-shrink-0" />

        {/* Wave CTA */}
        <button
          className="
            text-[10px] font-semibold whitespace-nowrap
            text-[var(--color-text-brand-primary)]
            bg-[var(--color-bg-brand-primary)]
            hover:bg-[var(--color-bg-brand-section)]
            px-2.5 py-1 rounded-lg
            border border-[var(--color-border-brand)]/30
            transition-colors duration-100
          "
          onClick={() => {/* Phase 5+: socket.emit('wave', { toUserId: displayId }) */}}
        >
          👋 Saludar
        </button>
      </div>
    </div>
  )
}
