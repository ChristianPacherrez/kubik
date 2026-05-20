import prisma from '../config/database'
import { UserStatus, UserRole, UserPublic } from '../types'

// Convierte un usuario de Prisma al tipo público (sin campos sensibles)
function toPublicUser(user: {
  id: string
  clerkId: string
  name: string
  email: string
  avatarUrl: string | null
  role: string
  status: string
}): UserPublic {
  return {
    id: user.id,
    clerkId: user.clerkId,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role as UserRole,
    status: user.status as UserStatus,
  }
}

// Obtiene todos los usuarios que no están OFFLINE
export async function getOnlineUsers(): Promise<UserPublic[]> {
  const users = await prisma.user.findMany({
    where: {
      status: { not: UserStatus.OFFLINE },
    },
    select: {
      id: true,
      clerkId: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      status: true,
    },
    orderBy: { name: 'asc' },
  })

  return users.map(toPublicUser)
}

// Obtiene un usuario por su ID interno
export async function getUserById(id: string): Promise<UserPublic | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      clerkId: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      status: true,
    },
  })

  return user ? toPublicUser(user) : null
}

// Actualiza el estado de presencia de un usuario
export async function updateUserStatus(
  id: string,
  status: UserStatus
): Promise<UserPublic> {
  const user = await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      clerkId: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      status: true,
    },
  })

  return toPublicUser(user)
}

// Upsert de usuario al conectarse via socket
// Usamos upsert en lugar de create para manejar reconexiones sin duplicar usuarios
export async function upsertUser(data: {
  clerkId: string
  name: string
  email: string
  avatarUrl?: string
}): Promise<UserPublic> {
  const user = await prisma.user.upsert({
    where: { clerkId: data.clerkId },
    create: {
      clerkId: data.clerkId,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl ?? null,
      status: UserStatus.AVAILABLE,
      role: UserRole.COLLABORATOR,
    },
    update: {
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl ?? null,
      status: UserStatus.AVAILABLE, // Al reconectarse, marcar como disponible
    },
    select: {
      id: true,
      clerkId: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      status: true,
    },
  })

  return toPublicUser(user)
}

// Marca al usuario como OFFLINE cuando su socket se desconecta
export async function setUserOffline(clerkId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { clerkId },
    data: { status: UserStatus.OFFLINE },
  })
}
