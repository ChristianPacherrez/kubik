'use client'

import { useEffect, useState } from 'react'
import { formatTime } from '@/lib/utils'

interface ClientTimeProps {
  timestamp: string
  className?: string
}

/**
 * Formatea una hora ("14:35") de forma segura en Next.js.
 *
 * Estrategia anti-hydration-mismatch:
 *  - Servidor (SSR):         renderiza null  →  sin texto en el HTML inicial
 *  - Cliente (1ª pasada):    renderiza null  →  coincide con el servidor ✓
 *  - Cliente (tras mount):   renderiza la hora real vía useEffect
 *
 * Necesario porque formatTime usa Date.getHours() / Date.getMinutes()
 * con la zona horaria LOCAL. Si la zona del servidor (ej. UTC en producción)
 * difiere de la del browser, el string varía → mismatch.
 */
export function ClientTime({ timestamp, className }: ClientTimeProps) {
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    setText(formatTime(timestamp))
  }, [timestamp])

  if (text === null) return null

  return <span className={className}>{text}</span>
}
