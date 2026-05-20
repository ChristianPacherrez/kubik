// Tipos compartidos del frontend — deben mantenerse sincronizados con el backend

export enum UserStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  IN_MEETING = 'IN_MEETING',
  AWAY = 'AWAY',
  OFFLINE = 'OFFLINE',
}

export enum UserRole {
  HOST = 'HOST',
  ADMIN = 'ADMIN',
  COLLABORATOR = 'COLLABORATOR',
}

export interface User {
  id: string
  clerkId: string
  name: string
  email: string
  avatarUrl: string | null
  role: UserRole
  status: UserStatus
}

export interface Message {
  userId: string
  name: string
  content: string
  roomId: string
  timestamp: string
}

export interface Room {
  id: string
  name: string
  maxCapacity: number
  type: 'OPEN' | 'MEETING' | 'FOCUS' | 'LOUNGE'
}

// Mapeo de estado a etiqueta legible en español
export const STATUS_LABELS: Record<UserStatus, string> = {
  [UserStatus.AVAILABLE]: 'Disponible',
  [UserStatus.BUSY]: 'Ocupado',
  [UserStatus.IN_MEETING]: 'En reunión',
  [UserStatus.AWAY]: 'Ausente',
  [UserStatus.OFFLINE]: 'Desconectado',
}

// Mapeo de estado a color (Tailwind class)
export const STATUS_COLORS: Record<UserStatus, string> = {
  [UserStatus.AVAILABLE]: 'bg-green-500',
  [UserStatus.BUSY]: 'bg-orange-500',
  [UserStatus.IN_MEETING]: 'bg-red-500',
  [UserStatus.AWAY]: 'bg-slate-400',
  [UserStatus.OFFLINE]: 'bg-slate-600',
}
