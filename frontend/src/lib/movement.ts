// movement.ts — constantes y utilidades del sistema de movimiento
//
// Fuente de verdad para velocidad, tamaño del avatar y límites de movimiento.
// Re-exporta desde office-geometry para que useMovement.ts no cambie sus imports.
// No importa React — seguro en hooks, stores y componentes.

import {
  PLAYER_START_X,
  PLAYER_START_Y,
  MOVEMENT_BOUNDS,
  NPC_POSITIONS,
  detectZoneAtPoint,
} from './office-geometry'

// ─── Re-exports para compatibilidad con useMovement.ts ────────────────────────

export { MOVEMENT_BOUNDS, NPC_POSITIONS, detectZoneAtPoint }
export { PLAYER_START_X, PLAYER_START_Y }

// ─── Constantes de movimiento ─────────────────────────────────────────────────

/** Velocidad del jugador en píxeles por segundo */
export const PLAYER_SPEED = 180

/** Diámetro del avatar en px */
export const PLAYER_SIZE = 28

// ─── Utilidades ───────────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
