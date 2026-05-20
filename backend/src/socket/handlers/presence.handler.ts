import { Server, Socket } from 'socket.io'
import * as usersService from '../../services/users.service'
import { SocketEvents, UserConnectPayload, UserStatus } from '../../types'

// Maneja todos los eventos relacionados con la presencia de usuarios
// (conectarse, cambiar estado, desconectarse)
export function registerPresenceHandlers(io: Server, socket: Socket): void {
  // El cliente emite este evento justo después de conectarse,
  // enviando sus datos de perfil de Clerk
  socket.on(SocketEvents.USER_CONNECT, async (payload: UserConnectPayload) => {
    try {
      const user = await usersService.upsertUser({
        clerkId: payload.clerkId,
        name: payload.name,
        email: payload.email,
        avatarUrl: payload.avatarUrl,
      })

      // Guardar el clerkId en el socket para poder usarlo en la desconexión
      // sin necesidad de hacer una consulta extra a la BD
      socket.data.clerkId = user.clerkId
      socket.data.userId = user.id

      // Unir al usuario al room de Socket.io que corresponde a su sala en la oficina
      // Por defecto, todos entran al lobby
      await socket.join('room:lobby')
      socket.data.currentRoom = 'room:lobby'

      // Emitir la lista actualizada de usuarios a todos los clientes conectados
      const onlineUsers = await usersService.getOnlineUsers()
      io.emit(SocketEvents.PRESENCE_UPDATE, onlineUsers)

      console.log(`[presence] Usuario conectado: ${user.name} (${user.clerkId})`)
    } catch (error) {
      console.error('[presence.handler] Error en user:connect:', error)
      socket.emit('error', { message: 'Error al registrar conexión' })
    }
  })

  // El usuario cambia su estado manualmente (ej. se pone como ocupado)
  socket.on(
    SocketEvents.USER_STATUS,
    async (payload: { status: UserStatus }) => {
      try {
        if (!socket.data.userId) {
          socket.emit('error', { message: 'Usuario no identificado' })
          return
        }

        // Validar que el status sea uno válido
        if (!Object.values(UserStatus).includes(payload.status)) {
          socket.emit('error', { message: 'Estado inválido' })
          return
        }

        await usersService.updateUserStatus(socket.data.userId, payload.status)

        const onlineUsers = await usersService.getOnlineUsers()
        io.emit(SocketEvents.PRESENCE_UPDATE, onlineUsers)
      } catch (error) {
        console.error('[presence.handler] Error en user:status:', error)
      }
    }
  )

  // Socket.io dispara este evento automáticamente cuando el cliente se desconecta
  socket.on('disconnect', async () => {
    try {
      if (!socket.data.clerkId) return

      await usersService.setUserOffline(socket.data.clerkId)

      // Notificar a todos que la lista de presencia cambió
      const onlineUsers = await usersService.getOnlineUsers()
      io.emit(SocketEvents.PRESENCE_UPDATE, onlineUsers)

      console.log(`[presence] Usuario desconectado: ${socket.data.clerkId}`)
    } catch (error) {
      console.error('[presence.handler] Error en disconnect:', error)
    }
  })
}
