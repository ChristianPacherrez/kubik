'use client'

// WorkModePicker — floating panel to change the player's work mode
//
// Rendered as an overlay inside TransformWrapper (not in canvas coordinates).
// Work mode change → useWorkModeStore → broadcast via Presence track in
// useRealtimePresence → all clients see the updated mode on the peer's avatar.

import { useState } from 'react'
import { useWorkModeStore }          from '@/store/work-mode.store'
import { WORK_MODES, WORK_MODE_LIST } from '@/lib/work-modes'
import { Check, ChevronDown } from 'lucide-react'

export function WorkModePicker() {
  const { mode, setMode } = useWorkModeStore()
  const [isOpen, setIsOpen] = useState(false)
  const cfg = WORK_MODES[mode]

  return (
    <div className="relative">

      {/* ── Current mode trigger ────────────────────────────── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="
          flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-[var(--color-bg-primary)]/90
          border border-[var(--color-border-secondary)]
          backdrop-blur-sm text-xs font-medium
          hover:border-[var(--color-border-primary)]
          hover:bg-[var(--color-bg-primary)]
          transition-all duration-150 select-none shadow-xs
        "
        title={cfg.description}
      >
        <span className="text-sm leading-none">{cfg.emoji}</span>
        <span className="text-[var(--color-text-secondary)] font-semibold">{cfg.label}</span>
        <ChevronDown
          className="w-3 h-3 text-[var(--color-fg-quaternary)] transition-transform duration-150"
          strokeWidth={2.5}
          style={{ transform: isOpen ? 'rotate(180deg)' : undefined }}
        />
      </button>

      {/* ── Mode dropdown ───────────────────────────────────── */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="
              absolute bottom-full mb-2 right-0
              bg-[var(--color-bg-primary)]/96
              border border-[var(--color-border-secondary)]
              rounded-xl p-1.5 backdrop-blur-sm
              shadow-lg min-w-[220px]
            "
            style={{ zIndex: 50 }}
          >
            <p className="
              text-[10px] font-semibold uppercase tracking-wider
              text-[var(--color-fg-quaternary)]
              px-2.5 pt-1.5 pb-1
            ">
              Estado de trabajo
            </p>

            {WORK_MODE_LIST.map((m) => {
              const c       = WORK_MODES[m]
              const isActive = m === mode

              return (
                <button
                  key={m}
                  onClick={() => { setMode(m); setIsOpen(false) }}
                  className={`
                    w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left
                    transition-colors duration-100
                    ${isActive
                      ? 'bg-[var(--color-bg-secondary)]'
                      : 'hover:bg-[var(--color-bg-primary_hover)]'
                    }
                  `}
                >
                  {/* Mode color indicator */}
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: isActive ? c.color : 'var(--color-border-primary)' }}
                  />

                  <span className="text-sm leading-none w-5 text-center flex-shrink-0">
                    {c.emoji}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[11px] font-semibold leading-tight"
                      style={{ color: isActive ? c.color : 'var(--color-text-secondary)' }}
                    >
                      {c.label}
                    </p>
                    <p className="text-[9px] text-[var(--color-fg-quaternary)] truncate mt-0.5">
                      {c.description}
                    </p>
                  </div>

                  {isActive && (
                    <Check
                      className="w-3 h-3 flex-shrink-0"
                      strokeWidth={2.5}
                      style={{ color: c.color }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
