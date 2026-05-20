'use client'

// ProximityPanel — contextual social UI when a peer is nearby (Spatial Social)
//
// Mounts when closestPeer enters PROXIMITY_NEARBY distance (80px).
// Position: fixed overlay bottom-left of the map area (outside canvas transform).
// Updates: driven by useProximity at 10fps — only re-renders when peer list changes.
//
// Provides:
//   · Peer identity + work mode status
//   · Quick reaction bar (👋 ✊ 🎉 👍 💡) — broadcasts via Supabase
//   · Huddle suggestion when ≥1 peer is within PROXIMITY_HUDDLE (140px)
//   · Multiple nearby peers summary ("+N más" indicator)

import { useProximity }              from '@/hooks/useProximity'
import { WORK_MODES }                from '@/lib/work-modes'
import { sendReaction, useRealtimeStore } from '@/store/realtime.store'
import { useWorkModeStore }          from '@/store/work-mode.store'

const REACTIONS = ['👋', '✊', '🎉', '👍', '💡'] as const

export function ProximityPanel() {
  const { nearbyPeers, huddlePeers, closestPeer, isInHuddle } = useProximity()
  const setLocalReaction = useWorkModeStore((s) => s.setLocalReaction)
  const setReaction      = useRealtimeStore((s) => s.setReaction)

  if (!closestPeer) return null

  const cfg = WORK_MODES[closestPeer.workMode ?? 'available']

  const handleReaction = (emoji: string) => {
    // Broadcast to all peers
    sendReaction(emoji)
    // Show bubble on local player's own avatar
    setLocalReaction(emoji)
    setTimeout(() => setLocalReaction(null), 2500)
    // Show bubble on the closest peer's avatar too (optimistic, they'll get broadcast)
    setReaction(closestPeer.userId, emoji)
  }

  return (
    <div
      key={closestPeer.userId}
      className="absolute bottom-16 left-4 pointer-events-auto"
      style={{ zIndex: 30, animation: 'proximityIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
    >
      <div className="
        bg-[var(--color-bg-primary)]/96 border border-[var(--color-border-secondary)]
        rounded-xl p-3 backdrop-blur-sm shadow-2xl
        min-w-[210px] max-w-[250px]
      ">

        {/* ── Peer identity ─────────────────────────────────── */}
        <div className="flex items-center gap-2.5 mb-2.5">
          {/* Avatar / initials */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 overflow-hidden"
            style={{
              background: cfg.color + '30',
              border:     `1.5px solid ${cfg.color}55`,
            }}
          >
            {closestPeer.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={closestPeer.avatarUrl}
                alt={closestPeer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              closestPeer.name.trim().split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
            )}
          </div>

          {/* Name + work mode */}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-[var(--color-text-primary)] truncate leading-tight">
              {closestPeer.name.split(' ')[0]}
            </p>
            <p className="text-[9px] flex items-center gap-1 mt-0.5" style={{ color: cfg.color }}>
              <span>{cfg.emoji}</span>
              <span>{cfg.label}</span>
            </p>
          </div>

          {/* "+N más" when multiple peers are nearby */}
          {nearbyPeers.length > 1 && (
            <div className="flex-shrink-0 ml-auto">
              <span className="
                text-[8px] text-[var(--color-text-quaternary)] font-medium
                bg-[var(--color-bg-primary)] rounded-full px-1.5 py-0.5
                border border-[var(--color-border-secondary)]
              ">
                +{nearbyPeers.length - 1}
              </span>
            </div>
          )}
        </div>

        {/* ── Quick reactions ───────────────────────────────── */}
        <div className="flex items-center gap-1 mb-0">
          {REACTIONS.map((r) => (
            <button
              key={r}
              onClick={() => handleReaction(r)}
              className="
                w-7 h-7 rounded-lg
                bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-primary)]
                flex items-center justify-center
                text-sm leading-none
                border border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)]
                transition-all duration-100 hover:scale-110 active:scale-90
                select-none
              "
              title={`Reaccionar con ${r}`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* ── Huddle suggestion ─────────────────────────────── */}
        {isInHuddle && (
          <div className="mt-2.5 pt-2.5 border-t border-[var(--color-border-secondary)]/50">
            <div className="flex items-center gap-2">
              {/* Ping indicator */}
              <div className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border border-indigo-500/60"
                  style={{ animation: 'huddlePing 1.8s ease-out infinite' }}
                />
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-indigo-400 leading-tight">
                  Huddle espontáneo
                </p>
                <p className="text-[9px] text-[var(--color-fg-quaternary)] truncate">
                  {huddlePeers.length === 1
                    ? `${huddlePeers[0].name.split(' ')[0]} está aquí`
                    : `${huddlePeers.length} personas cerca`}
                </p>
              </div>

              <button
                className="
                  flex-shrink-0 px-2.5 py-1 rounded-lg
                  text-[10px] font-semibold text-indigo-400
                  bg-indigo-500/15 border border-indigo-500/30
                  hover:bg-indigo-500/25 hover:border-indigo-500/50
                  transition-all duration-100 select-none
                "
              >
                Unirse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
