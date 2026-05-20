// Tipos compartidos del backend
// Estos deben mantenerse sincronizados con frontend/src/types/index.ts

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

export interface UserPublic {
  id: string
  clerkId: string
  name: string
  email: string
  avatarUrl: string | null
  role: UserRole
  status: UserStatus
}

// Payload que el cliente envía al conectarse via socket
export interface UserConnectPayload {
  clerkId: string
  name: string
  email: string
  avatarUrl?: string
}

// Nombres de eventos de Socket.io, centralizados para evitar typos
export const SocketEvents = {
  // Emitidos por el cliente
  USER_CONNECT: 'user:connect',
  USER_STATUS: 'user:status',
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  PLAYER_MOVE: 'player:move',

  // Emitidos por el servidor
  PRESENCE_UPDATE: 'presence:update',
  CHAT_MESSAGE_BROADCAST: 'chat:message',
  CHAT_TYPING_BROADCAST: 'chat:typing',
  PLAYER_MOVED: 'player:moved',
} as const

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents]

// Extiende el tipo de Express Request para incluir el userId de Clerk
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}
