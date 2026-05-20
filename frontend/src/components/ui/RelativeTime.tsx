'use client'

import { useEffect, useState } from 'react'
import { getRelativeTime } from '@/lib/utils'

interface RelativeTimeProps {
  timestamp: string
  className?: string
  /** Intervalo de refresco automático en ms. Default: 30 000 (30 s). */
  refreshMs?: number
}

/**
 * Muestra tiempo relativo ("hace 5m") de forma segura en Next.js.
 *
 * Estrategia anti-hydration-mismatch:
 *  - Servidor (SSR):         renderiza null  →  sin texto en el HTML inicial
 *  - Cliente (1ª pasada):    renderiza null  →  coincide con el HTML del servidor ✓
 *  - Cliente (tras mount):   renderiza el texto real vía useEffect
 *
 * Esto evita el error "Text content does not match server-rendered HTML"
 * que aparece cuando getRelativeTime() devuelve valores distintos en
 * server vs client (diferencia de milisegundos a minutos en módulos cacheados).
 *
 * El componente también se auto-refresca cada `refreshMs` para que
 * "hace 4m" pase a "hace 5m" sin recargar la página.
 */
export function RelativeTime({
  timestamp,
  className,
  refreshMs = 30_000,
}: RelativeTimeProps) {
  // null = aún no montado (server + primera pasada client)
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    // Solo corre en el cliente, DESPUÉS de la hidratación
    setText(getRelativeTime(timestamp))

    const id = setInterval(
      () => setText(getRelativeTime(timestamp)),
      refreshMs,
    )
    return () => clearInterval(id)
  }, [timestamp, refreshMs])

  // Hasta que el efecto corra, no renderizamos nada → el HTML
  // del servidor y el del cliente coinciden (ambos vacíos)
  if (text === null) return null

  return <span className={className}>{text}</span>
}
