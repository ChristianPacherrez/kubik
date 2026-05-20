// soundscape.ts — Soundscape zone architecture (Phase 3 Living Office)
//
// No real audio implemented yet. Defines the data model and proximity math
// for Phase 4 integration (howler.js / Web Audio API).
//
// Design: proximity-based volume model.
//   · Each room defines an ambient loop sound + base volume + full-volume radius.
//   · Player approaching a zone hears its sound fade in from 0 at 2×radius.
//   · Multiple zones can overlap — volumes are summed and clamped to 1.
//   · SFX events fire on store events (session start/end, peer enter/leave).

// ─── Types ────────────────────────────────────────────────────────────────────

export type AmbientSound =
  | 'ambient-lobby'      // soft music, occasional footsteps, reception chatter
  | 'ambient-focus'      // lo-fi beats, keyboard clicks, gentle HVAC
  | 'ambient-meeting'    // muffled voices, presentation clicks, A/V hum
  | 'ambient-cafeteria'  // cafe ambience, espresso machine, clinking cups
  | 'ambient-collab'     // keyboard typing, server hum, occasional Slack pings
  | 'ambient-support'    // call center murmur, ticket dings, office HVAC

export type SFXSound =
  | 'sfx-enter-room'     // soft footstep/transition on room entry
  | 'sfx-leave-room'     // subtle whoosh on room exit
  | 'sfx-session-start'  // soft chime — session begins
  | 'sfx-session-end'    // gentler chime — session ends
  | 'sfx-peer-join'      // subtle pop — peer connects
  | 'sfx-peer-leave'     // subtle fade-out — peer disconnects
  | 'sfx-notification'   // neutral ping — new message / mention

export interface SoundZone {
  /** Matches OfficeZone.id */
  roomId:     string
  sound:      AmbientSound
  /** Base volume at distance ≤ radius (0..1) */
  volume:     number
  /** px — full volume within radius, linear fade to 0 at radius×2 */
  radius:     number
  /** Center of the zone in map coordinates (px) */
  cx:         number
  cy:         number
}

// ─── Zone definitions ─────────────────────────────────────────────────────────
// cx/cy approximate center of each room from ROOM_LAYOUTS in map-layout.ts

export const SOUNDSCAPE_ZONES: SoundZone[] = [
  { roomId: 'lobby',     sound: 'ambient-lobby',     volume: 0.42, radius: 160, cx: 180, cy: 130 },
  { roomId: 'focus',     sound: 'ambient-focus',     volume: 0.30, radius: 140, cx: 600, cy: 130 },
  { roomId: 'meeting',   sound: 'ambient-meeting',   volume: 0.25, radius: 135, cx: 600, cy: 490 },
  { roomId: 'cafeteria', sound: 'ambient-cafeteria', volume: 0.44, radius: 155, cx: 180, cy: 490 },
  { roomId: 'collab',    sound: 'ambient-collab',    volume: 0.34, radius: 160, cx: 990, cy: 130 },
  { roomId: 'support',   sound: 'ambient-support',   volume: 0.30, radius: 155, cx: 990, cy: 490 },
]

// ─── Proximity volume math ────────────────────────────────────────────────────

/**
 * Returns the volume [0..baseVolume] for a zone based on player distance.
 *   · distance ≤ radius        → baseVolume (full)
 *   · distance ≥ radius × 2   → 0 (silent)
 *   · in between               → linear interpolation
 */
export function getProximityVolume(
  playerX:    number,
  playerY:    number,
  zone:       SoundZone,
): number {
  const dist = Math.hypot(playerX - zone.cx, playerY - zone.cy)
  if (dist <= zone.radius)         return zone.volume
  if (dist >= zone.radius * 2)     return 0
  const fade = 1 - (dist - zone.radius) / zone.radius
  return zone.volume * fade
}

/**
 * Returns a map of roomId → computed volume for all zones.
 * Useful for a single pass over all zones per position update.
 */
export function computeAllVolumes(
  playerX: number,
  playerY: number,
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const zone of SOUNDSCAPE_ZONES) {
    result[zone.roomId] = getProximityVolume(playerX, playerY, zone)
  }
  return result
}

// ─── Hook stub ───────────────────────────────────────────────────────────────

/**
 * useSoundscape — wires up the soundscape when audio is implemented (Phase 4).
 *
 * Phase 4 TODO:
 *   1. Load ambient loops via howler.js (lazy on first interaction)
 *   2. Subscribe to playerStore — on x/y change, call computeAllVolumes()
 *      and update Howl.volume() for each zone loop
 *   3. Subscribe to realtimeStore — play sfx-peer-join/leave on peer changes
 *   4. Subscribe to sessionsStore — play sfx-session-start/end on session changes
 *   5. Respect user's OS media preference (prefers-reduced-motion → lower volumes)
 *   6. Expose a mute toggle in MapControls
 */
export function useSoundscape(): void {
  // No-op until Phase 4
}
