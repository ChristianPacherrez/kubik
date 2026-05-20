// Utilidades compartidas del frontend
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases de Tailwind de forma segura (clsx + tailwind-merge).
 * Uso: cn('px-2 py-1', isActive && 'bg-primary', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Convierte un timestamp ISO a tiempo relativo legible en español.
 * Ej: "hace 5m", "hace 2h", "hace 3d"
 */
export function getRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const secs  = Math.floor(diff / 1000)
  const mins  = Math.floor(secs  / 60)
  const hours = Math.floor(mins  / 60)
  const days  = Math.floor(hours / 24)

  if (secs  < 30)  return 'ahora mismo'
  if (mins  < 1)   return 'hace un momento'
  if (mins  < 60)  return `hace ${mins}m`
  if (hours < 24)  return `hace ${hours}h`
  return `hace ${days}d`
}

/**
 * Formatea un timestamp a hora legible (HH:MM) en hora local.
 *
 * No usa toLocaleTimeString para evitar variaciones entre la implementación
 * de Intl en Node.js (servidor) y la del browser. La aritmética explícita
 * produce la misma cadena en ambos entornos dado el mismo timestamp.
 * Usar siempre dentro de <ClientTime> para no exponer la zona horaria
 * del servidor al HTML inicial.
 */
export function formatTime(timestamp: string): string {
  const d = new Date(timestamp)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/**
 * Genera un color de avatar determinístico a partir de un nombre.
 * El mismo nombre siempre genera el mismo color.
 */
export function getAvatarColorClass(name: string): string {
  const palette = [
    'bg-kubik-600',
    'bg-violet-600',
    'bg-indigo-600',
    'bg-sky-600',
    'bg-emerald-600',
    'bg-teal-600',
    'bg-rose-600',
    'bg-orange-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return palette[Math.abs(hash) % palette.length]
}

/**
 * Extrae las iniciales de un nombre completo (máx. 2 caracteres).
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Clasifica si un timestamp es reciente (< 5 min).
 */
export function isRecent(timestamp: string): boolean {
  return Date.now() - new Date(timestamp).getTime() < 5 * 60 * 1000
}
