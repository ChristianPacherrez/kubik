'use client'

// CameraController — sigue al jugador con la cámara (sin DOM output)
//
// Debe montarse DENTRO de <TransformWrapper> para acceder a sus hooks.
// No renderiza nada — es puro efecto.
//
// Algoritmo:
//   1. Loop rAF propio (independiente del loop de movimiento)
//   2. Lee posición del jugador via usePlayerStore.getState() (sin suscripción)
//   3. Calcula la transformación objetivo para centrar al jugador en el viewport
//   4. Lerp suave (t=0.08) hacia el objetivo mientras el jugador se mueve
//   5. Continúa el lerp unos frames tras detenerse (catch-up suave)
//   6. Para de seguir cuando la distancia al objetivo < 1px
//
// Integración con react-zoom-pan-pinch:
//   · useControls() → setTransform(x, y, scale, animationTime=0)
//     con animationTime=0 aplica la transformación CSS directamente
//     sin pasar por el sistema de animación de la librería → seguro a 60fps
//   · useTransformContext() → leer scale y posición actuales síncronamente

import { useEffect, useRef } from 'react'
import { useControls, useTransformContext } from 'react-zoom-pan-pinch'
import { usePlayerStore } from '@/store/player.store'

interface CameraControllerProps {
  /** Ref al div contenedor del área del mapa (para leer dimensiones del viewport) */
  containerRef: React.RefObject<HTMLDivElement>
}

/** Lerp lineal — t: 0=sin movimiento, 1=snap inmediato */
function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

export function CameraController({ containerRef }: CameraControllerProps) {
  const context  = useTransformContext() // instancia estable del ZoomPanPinch
  const controls = useControls()         // handlers de la librería

  // Refs para usar siempre la versión más reciente en el loop rAF
  // sin que el efecto necesite re-ejecutarse
  const setTransformRef = useRef(controls.setTransform)
  useEffect(() => { setTransformRef.current = controls.setTransform })

  // Flag: ¿debería la cámara seguir al jugador?
  // true mientras se mueve + unos frames de catch-up tras detenerse
  const followingRef = useRef(false)

  useEffect(() => {
    let rafId: number

    const tick = () => {
      const { x: px, y: py, isMoving } = usePlayerStore.getState()

      // Activar seguimiento cuando el jugador se mueve
      if (isMoving) followingRef.current = true

      if (followingRef.current && containerRef.current) {
        const containerW = containerRef.current.clientWidth
        const containerH = containerRef.current.clientHeight

        // Leer transformación actual directamente de la instancia (no desde React state)
        // ZoomPanPinch expone el estado en context.state (no transformState)
        const { scale, positionX, positionY } = context.state

        // Posición objetivo: jugador centrado en el viewport
        const targetX = containerW / 2 - px * scale
        const targetY = containerH / 2 - py * scale

        // Lerp — más rápido durante el movimiento, más suave en el catch-up
        const t = isMoving ? 0.08 : 0.14
        const newX = lerp(positionX, targetX, t)
        const newY = lerp(positionY, targetY, t)

        // animationTime=0 → CSS transform aplicado directamente, sin queue
        setTransformRef.current(newX, newY, scale, 0)

        // Cuando el jugador para y la cámara ha llegado suficientemente cerca, detener
        if (!isMoving) {
          const dist = Math.hypot(targetX - newX, targetY - newY)
          if (dist < 0.8) followingRef.current = false
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [context, containerRef]) // context y containerRef son refs estables

  return null
}
