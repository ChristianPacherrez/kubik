'use client'

// useMovement — motor de movimiento local del jugador
//
// Diseño:
//   · Lee teclado via Set<string> (no React state) → sin re-renders por keydown
//   · Loop rAF con delta time → movimiento a 60fps frame-rate independent
//   · Escribe al store vía getState() → sin dependencias estales en el closure
//   · Detecta zona en cada frame y sincroniza officeStore.selectedZoneId
//   · Ignora input si el foco está en un <input> o <textarea>
//
// Uso: llamar una sola vez en InteractiveMap (o en el componente raíz del mapa).

import { useEffect } from 'react'
import {
  PLAYER_SPEED,
  MOVEMENT_BOUNDS,
  NPC_POSITIONS,
  detectZoneAtPoint,
  clamp,
} from '@/lib/movement'
import { usePlayerStore } from '@/store/player.store'
import { useOfficeStore } from '@/store/office.store'

/** Radio en px: si el centro del player está a menos de esto de un NPC, se activa la proximidad */
const PROXIMITY_RADIUS = 78

const KEYS_RIGHT = new Set(['ArrowRight', 'd', 'D'])
const KEYS_LEFT  = new Set(['ArrowLeft',  'a', 'A'])
const KEYS_DOWN  = new Set(['ArrowDown',  's', 'S'])
const KEYS_UP    = new Set(['ArrowUp',    'w', 'W'])
const ARROW_KEYS = new Set(['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'])

/** Devuelve true si el foco está en un campo de texto — evita conflictos con el chat */
function isFocusedOnInput(): boolean {
  const el = document.activeElement as HTMLElement | null
  if (!el) return false
  return (
    el.tagName === 'INPUT'      ||
    el.tagName === 'TEXTAREA'   ||
    el.isContentEditable
  )
}

export function useMovement(): void {
  useEffect(() => {
    // Set de teclas presionadas en este momento.
    // Usar un Set en lugar de React state evita re-renders por cada keydown.
    const held = new Set<string>()

    const onKeyDown = (e: KeyboardEvent) => {
      if (isFocusedOnInput()) return
      // Prevenir scroll nativo del browser con las arrow keys
      if (ARROW_KEYS.has(e.key)) e.preventDefault()
      held.add(e.key)
    }

    const onKeyUp = (e: KeyboardEvent) => held.delete(e.key)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)

    // ── Loop de movimiento ─────────────────────────────────
    let lastTime = performance.now()
    let rafId:    number

    const tick = (now: number) => {
      // Delta time en segundos, capeado a 50ms para no saltar tras tab-switch
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime  = now

      // Leer input (Array.from evita el flag --downlevelIteration del spread de Set)
      const right = Array.from(KEYS_RIGHT).some((k) => held.has(k)) ? 1 : 0
      const left  = Array.from(KEYS_LEFT ).some((k) => held.has(k)) ? 1 : 0
      const down  = Array.from(KEYS_DOWN ).some((k) => held.has(k)) ? 1 : 0
      const up    = Array.from(KEYS_UP   ).some((k) => held.has(k)) ? 1 : 0

      const dx = right - left
      const dy = down  - up

      const moving = dx !== 0 || dy !== 0

      // Leer store sin suscribirse (evita stale closures)
      const player = usePlayerStore.getState()
      const office = useOfficeStore.getState()

      player.setMoving(moving)

      if (moving) {
        // Normalizar diagonal: sqrt(2)/2 ≈ 0.707 para que la velocidad
        // diagonal sea igual a la cardinal (no 41% más rápida)
        const len  = dx !== 0 && dy !== 0 ? Math.SQRT2 : 1
        const newX = clamp(
          player.x + (dx / len) * PLAYER_SPEED * dt,
          MOVEMENT_BOUNDS.minX,
          MOVEMENT_BOUNDS.maxX
        )
        const newY = clamp(
          player.y + (dy / len) * PLAYER_SPEED * dt,
          MOVEMENT_BOUNDS.minY,
          MOVEMENT_BOUNDS.maxY
        )

        player.setPosition(newX, newY)

        // Dirección: prioriza el eje con mayor magnitud
        if (Math.abs(dx) >= Math.abs(dy)) {
          player.setDirection(dx > 0 ? 'right' : 'left')
        } else {
          player.setDirection(dy > 0 ? 'down' : 'up')
        }

        // Detección de zona: solo actualiza cuando cambia
        const newZone = detectZoneAtPoint(newX, newY)
        if (newZone !== player.currentZoneId) {
          player.setCurrentZone(newZone)
          // Sincronizar con el store de oficina para el sidebar del mapa
          office.setSelectedZone(newZone)
        }

        // ── Detección de proximidad a NPCs ─────────────────────
        // Busca el NPC más cercano dentro del radio (no el primero encontrado)
        let closestId:   string | null = null
        let closestDist: number        = PROXIMITY_RADIUS

        for (const [userId, pos] of Object.entries(NPC_POSITIONS)) {
          const dist = Math.hypot(newX - pos.x, newY - pos.y)
          if (dist < closestDist) {
            closestDist = dist
            closestId   = userId
          }
        }

        if (closestId !== player.nearbyNpcId) {
          player.setNearbyNpc(closestId)
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
      cancelAnimationFrame(rafId)
    }
  }, []) // sin dependencias — usa getState() para leer sin closures estales
}
