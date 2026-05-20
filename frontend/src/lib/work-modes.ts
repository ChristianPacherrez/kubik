// work-modes.ts — Work mode types and visual config (Spatial Social Experience)
//
// WorkMode drives:
//   · StatusAura  — ring + glow on avatar (color, duration, badge)
//   · WorkModePicker — player selects their own mode
//   · ProximityPanel — shows peer's current mode
//   · Presence track — broadcast to all clients via Supabase

export type WorkMode =
  | 'available'
  | 'focus'
  | 'meeting'
  | 'collaborating'
  | 'dnd'

export interface WorkModeConfig {
  label:       string
  emoji:       string
  description: string
  /** Hex color for ring stroke + text accents */
  color:       string
  /** rgba for box-shadow glow spread */
  glow:        string
  /** Animation duration for aura breath pulse */
  auraDur:     string
  /** Emoji badge shown above the avatar (null = no badge for "available") */
  badge:       string | null
}

export const WORK_MODES: Record<WorkMode, WorkModeConfig> = {
  available: {
    label:       'Available',
    emoji:       '🟢',
    description: 'Open to collaborate and chat',
    color:       '#22c55e',
    glow:        'rgba(34,197,94,0.28)',
    auraDur:     '3.5s',
    badge:       null,           // no badge — clean default state
  },
  focus: {
    label:       'Focus',
    emoji:       '🎯',
    description: 'In deep work — prefer no interruptions',
    color:       '#818CF8',
    glow:        'rgba(129,140,248,0.38)',
    auraDur:     '4s',
    badge:       '🎯',
  },
  meeting: {
    label:       'In Meeting',
    emoji:       '📅',
    description: 'Currently in a meeting',
    color:       '#F87171',
    glow:        'rgba(248,113,113,0.36)',
    auraDur:     '1.8s',         // faster pulse = "busy"
    badge:       '📅',
  },
  collaborating: {
    label:       'Collaborating',
    emoji:       '⚡',
    description: 'Working together — join me!',
    color:       '#22D3EE',
    glow:        'rgba(34,211,238,0.36)',
    auraDur:     '2.2s',
    badge:       '⚡',
  },
  dnd: {
    label:       'Do Not Disturb',
    emoji:       '⛔',
    description: 'Fully focused — please do not interrupt',
    color:       '#64748b',
    glow:        'rgba(100,116,139,0.22)',
    auraDur:     '6s',           // very slow = "quiet"
    badge:       '⛔',
  },
}

export const WORK_MODE_LIST: WorkMode[] = [
  'available', 'focus', 'meeting', 'collaborating', 'dnd',
]
