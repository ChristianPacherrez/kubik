// work-mode.store.ts — Player's own work mode (local + persisted to localStorage)
//
// WorkMode changes are rare (user-initiated clicks) → re-renders are acceptable.
// The mode is broadcast to other clients via Supabase Presence track() call in
// useRealtimePresence whenever it changes.
//
// localReaction: ephemeral emoji shown above the local player's own avatar
// when they fire a reaction (clears after 2500ms automatically).

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WorkMode } from '@/lib/work-modes'

interface WorkModeState {
  mode:          WorkMode
  /** Ephemeral emoji bubble above own avatar (null = no bubble) */
  localReaction: string | null

  setMode:          (mode: WorkMode) => void
  setLocalReaction: (r: string | null) => void
}

export const useWorkModeStore = create<WorkModeState>()(
  persist(
    (set) => ({
      mode:          'available' as WorkMode,
      localReaction: null,

      setMode:          (mode)  => set({ mode }),
      setLocalReaction: (r)     => set({ localReaction: r }),
    }),
    {
      name:    'kubik-work-mode',
      // Only persist the mode — not the ephemeral reaction
      partialize: (state) => ({ mode: state.mode }),
    }
  )
)
