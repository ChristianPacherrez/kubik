// Mock data — Sprint 4
// Enriquecida con zonas de oficina virtual (VirtualOffice) y datos de ocupación
// Reemplazar por datos reales (WebSockets + API) en Sprint 5+

import { User, Message, Room, UserStatus, UserRole } from '@/types'

// ─── Anchor de tiempo fijo ────────────────────────────────────────────────────
//
// IMPORTANTE: NO usar Date.now() a nivel de módulo.
// Next.js puede tener este módulo cacheado en el servidor desde el arranque,
// mientras el cliente lo re-inicializa al hidratar → timestamps distintos
// → hydration mismatch en getRelativeTime().
//
// Solución: anchor ISO fija. Ambos entornos (server/client) computan
// el mismo valor determinístico. El componente <RelativeTime> se encarga
// de renderizar solo en el cliente para evitar cualquier diff de display.
//
const MOCK_ANCHOR = new Date('2026-05-14T10:30:00.000Z').getTime()

/** Devuelve un ISO string estable, X minutos antes del anchor. */
function ago(minutes: number): string {
  return new Date(MOCK_ANCHOR - minutes * 60_000).toISOString()
}

// ─── Usuarios ────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: '2',
    clerkId: 'clerk_2',
    name: 'Ana Torres',
    email: 'ana@kubik.io',
    avatarUrl: null,
    role: UserRole.ADMIN,
    status: UserStatus.AVAILABLE,
  },
  {
    id: '3',
    clerkId: 'clerk_3',
    name: 'Miguel Herrera',
    email: 'miguel@kubik.io',
    avatarUrl: null,
    role: UserRole.COLLABORATOR,
    status: UserStatus.IN_MEETING,
  },
  {
    id: '4',
    clerkId: 'clerk_4',
    name: 'Sofia Ruiz',
    email: 'sofia@kubik.io',
    avatarUrl: null,
    role: UserRole.COLLABORATOR,
    status: UserStatus.BUSY,
  },
  {
    id: '5',
    clerkId: 'clerk_5',
    name: 'Diego Mendoza',
    email: 'diego@kubik.io',
    avatarUrl: null,
    role: UserRole.COLLABORATOR,
    status: UserStatus.AWAY,
  },
  {
    id: '6',
    clerkId: 'clerk_6',
    name: 'Valeria Chen',
    email: 'valeria@kubik.io',
    avatarUrl: null,
    role: UserRole.COLLABORATOR,
    status: UserStatus.AVAILABLE,
  },
]

// ─── Actividad por usuario ────────────────────────────────────────────────────

export interface UserActivity {
  lastSeen: string        // ISO timestamp
  currentRoomId: string | null
  currentRoomName: string | null
  activityLabel: string   // texto descriptivo de lo que hace
}

export const MOCK_USER_ACTIVITY: Record<string, UserActivity> = {
  '2': {
    lastSeen:        ago(2),
    currentRoomId:   'lobby',
    currentRoomName: 'Lobby',
    activityLabel:   'Revisando código',
  },
  '3': {
    lastSeen:        ago(5),
    currentRoomId:   'meeting-1',
    currentRoomName: 'Sala de Reuniones',
    activityLabel:   'En reunión con el cliente',
  },
  '4': {
    lastSeen:        ago(1),
    currentRoomId:   'lobby',
    currentRoomName: 'Lobby',
    activityLabel:   'Respondiendo mensajes',
  },
  '5': {
    lastSeen:        ago(28),
    currentRoomId:   'dev',
    currentRoomName: 'Dev Room',
    activityLabel:   'Ausente temporalmente',
  },
  '6': {
    lastSeen:        ago(3),
    currentRoomId:   'lobby',
    currentRoomName: 'Lobby',
    activityLabel:   'Diseñando la UI del Sprint 3',
  },
}

// ─── Salas ────────────────────────────────────────────────────────────────────

export const MOCK_ROOMS: Room[] = [
  { id: 'lobby',     name: 'Lobby',            maxCapacity: 20, type: 'OPEN'    },
  { id: 'dev',       name: 'Dev Room',          maxCapacity: 8,  type: 'FOCUS'   },
  { id: 'meeting-1', name: 'Sala de Reuniones', maxCapacity: 10, type: 'MEETING' },
  { id: 'lounge',    name: 'Lounge',            maxCapacity: 15, type: 'LOUNGE'  },
]

// Ocupantes por sala
export const MOCK_ROOM_OCCUPANCY: Record<string, string[]> = {
  'lobby':     ['2', '4', '6'],
  'dev':       ['5'],
  'meeting-1': ['3'],
  'lounge':    [],
}

// ─── Canales de chat ─────────────────────────────────────────────────────────

export interface Channel {
  id: string
  name: string
  unread: number
  description: string
}

export const MOCK_CHANNELS: Channel[] = [
  { id: 'lobby',   name: 'lobby',   unread: 0, description: 'Canal principal del workspace' },
  { id: 'dev',     name: 'dev',     unread: 2, description: 'Conversaciones técnicas y código' },
  { id: 'design',  name: 'design',  unread: 1, description: 'UI/UX y recursos de diseño' },
  { id: 'general', name: 'general', unread: 0, description: 'Temas generales del equipo' },
]

// ─── Mensajes ─────────────────────────────────────────────────────────────────

export const MOCK_MESSAGES: Message[] = [
  {
    userId: '4',
    name: 'Sofia Ruiz',
    content: '¡Buenos días a todos! ☀️',
    roomId: 'lobby',
    timestamp: ago(32),
  },
  {
    userId: '2',
    name: 'Ana Torres',
    content: 'Buenos días! Hoy tenemos la demo del cliente a las 3pm 📊',
    roomId: 'lobby',
    timestamp: ago(28),
  },
  {
    userId: '3',
    name: 'Miguel Herrera',
    content: 'Confirmado. Ya preparé los slides y el ambiente de staging 👌',
    roomId: 'lobby',
    timestamp: ago(22),
  },
  {
    userId: '4',
    name: 'Sofia Ruiz',
    content: 'Perfecto! El cliente confirmó asistencia. Somos 5 de su lado.',
    roomId: 'lobby',
    timestamp: ago(18),
  },
  {
    userId: '6',
    name: 'Valeria Chen',
    content: '¿Alguien puede revisar el PR #42 antes del mediodía? 👀',
    roomId: 'lobby',
    timestamp: ago(10),
  },
  {
    userId: '2',
    name: 'Ana Torres',
    content: 'Lo reviso en 20 min, termino de deployar esto primero',
    roomId: 'lobby',
    timestamp: ago(5),
  },
]

// ─── Zonas de la oficina virtual (Sprint 4) ───────────────────────────────────

export type ZoneType = 'lobby' | 'focus' | 'meeting' | 'lounge' | 'collab' | 'support'

export interface OfficeZone {
  id: string
  name: string
  type: ZoneType
  icon: string
  description: string
  maxCapacity: number
  // Estilo visual
  accent: string        // color Tailwind (sin 'bg-') para la barra superior
  bgClass: string       // clase de fondo translúcido
  borderClass: string   // clase de borde
  glowClass: string     // shadow para zona activa
  dotClass: string      // color del indicador y avatar ring
  labelClass: string    // color de texto de acento
  textClass: string     // color de nombre de zona
}

export const OFFICE_ZONES: OfficeZone[] = [
  {
    id: 'lobby',
    name: 'Lobby',
    type: 'lobby',
    icon: '🏠',
    description: 'Punto de entrada — acceso libre',
    maxCapacity: 20,
    accent: 'bg-kubik-400',
    bgClass: 'bg-kubik-500/5',
    borderClass: 'border-kubik-500/30',
    glowClass: 'shadow-kubik-500/20',
    dotClass: 'bg-kubik-400',
    labelClass: 'text-kubik-400',
    textClass: 'text-kubik-300',
  },
  {
    id: 'focus',
    name: 'Focus Zone',
    type: 'focus',
    icon: '🎯',
    description: 'Trabajo profundo — sin interrupciones',
    maxCapacity: 6,
    accent: 'bg-emerald-400',
    bgClass: 'bg-emerald-500/5',
    borderClass: 'border-emerald-500/30',
    glowClass: 'shadow-emerald-500/20',
    dotClass: 'bg-emerald-400',
    labelClass: 'text-emerald-400',
    textClass: 'text-emerald-300',
  },
  {
    id: 'cafeteria',
    name: 'Cafetería',
    type: 'lounge',
    icon: '☕',
    description: 'Descanso y charla informal',
    maxCapacity: 12,
    accent: 'bg-amber-400',
    bgClass: 'bg-amber-500/5',
    borderClass: 'border-amber-500/30',
    glowClass: 'shadow-amber-500/20',
    dotClass: 'bg-amber-400',
    labelClass: 'text-amber-400',
    textClass: 'text-amber-300',
  },
  {
    id: 'meeting',
    name: 'Sala Reuniones',
    type: 'meeting',
    icon: '📋',
    description: 'Reuniones formales y demos',
    maxCapacity: 10,
    accent: 'bg-rose-400',
    bgClass: 'bg-rose-500/5',
    borderClass: 'border-rose-500/30',
    glowClass: 'shadow-rose-500/20',
    dotClass: 'bg-rose-400',
    labelClass: 'text-rose-400',
    textClass: 'text-rose-300',
  },
  {
    id: 'collab',
    name: 'Collab',
    type: 'collab',
    icon: '⚡',
    description: 'Pair programming y brainstorm',
    maxCapacity: 8,
    accent: 'bg-violet-400',
    bgClass: 'bg-violet-500/5',
    borderClass: 'border-violet-500/30',
    glowClass: 'shadow-violet-500/20',
    dotClass: 'bg-violet-400',
    labelClass: 'text-violet-400',
    textClass: 'text-violet-300',
  },
  {
    id: 'support',
    name: 'Support',
    type: 'support',
    icon: '🛠',
    description: 'Atención al cliente e incidencias',
    maxCapacity: 8,
    accent: 'bg-sky-400',
    bgClass: 'bg-sky-500/5',
    borderClass: 'border-sky-500/30',
    glowClass: 'shadow-sky-500/20',
    dotClass: 'bg-sky-400',
    labelClass: 'text-sky-400',
    textClass: 'text-sky-300',
  },
]

// Ocupantes por zona (userId[])
export const ZONE_OCCUPANCY: Record<string, string[]> = {
  lobby:     ['2', '4', '6'],
  focus:     ['5'],
  cafeteria: [],
  meeting:   ['3'],
  collab:    ['2'],
  support:   [],
}

// ─── Feed de actividad del workspace ─────────────────────────────────────────

export interface ActivityEvent {
  id: string
  userId: string
  userName: string
  action: string
  detail?: string
  timestamp: string
  type: 'join' | 'leave' | 'status' | 'message' | 'file'
}

export const MOCK_ACTIVITY_FEED: ActivityEvent[] = [
  {
    id: '1',
    userId: '2',
    userName: 'Ana Torres',
    action: 'entró al',
    detail: 'Lobby',
    timestamp: ago(2),
    type: 'join',
  },
  {
    id: '2',
    userId: '6',
    userName: 'Valeria Chen',
    action: 'compartió un archivo en',
    detail: '#design',
    timestamp: ago(8),
    type: 'file',
  },
  {
    id: '3',
    userId: '3',
    userName: 'Miguel Herrera',
    action: 'entró a',
    detail: 'Sala de Reuniones',
    timestamp: ago(10),
    type: 'join',
  },
  {
    id: '4',
    userId: '4',
    userName: 'Sofia Ruiz',
    action: 'cambió estado a',
    detail: 'Ocupado',
    timestamp: ago(15),
    type: 'status',
  },
  {
    id: '5',
    userId: '5',
    userName: 'Diego Mendoza',
    action: 'entró al',
    detail: 'Dev Room',
    timestamp: ago(25),
    type: 'join',
  },
]
