'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { getCurrentSocket } from '@/lib/socket'
import { useOfficeStore } from '@/store/office.store'
import { User } from '@/types'

// Hook que escucha eventos de presencia y mantiene el store actualizado
// También emite el evento de conexión inicial con los datos del usuario
export function usePresence() {
  const { user } = useUser()
  const { setOnlineUsers } = useOfficeStore()
  const isConnected = useOfficeStore((s) => s.isConnected)

  // Emitir user:connect cuando el socket está listo y el usuario está autenticado
  useEffect(() => {
    if (!isConnected || !user) return

    const socket = getCurrentSocket()
    if (!socket) return

    // Enviar datos del perfil de Clerk al servidor para hacer el upsert
    socket.emit('user:connect', {
      clerkId: user.id,
      name: user.fullName ?? user.username ?? 'Usuario',
      email: user.primaryEmailAddress?.emailAddress ?? '',
      avatarUrl: user.imageUrl,
    })
  }, [isConnected, user])

  // Escuchar actualizaciones de presencia
  useEffect(() => {
    const socket = getCurrentSocket()
    if (!socket) return

    const handlePresenceUpdate = (users: User[]) => {
      setOnlineUsers(users)
    }

    socket.on('presence:update', handlePresenceUpdate)

    return () => {
      socket.off('presence:update', handlePresenceUpdate)
    }
  }, [setOnlineUsers])

  return {
    onlineUsers: useOfficeStore((s) => s.onlineUsers),
  }
}
