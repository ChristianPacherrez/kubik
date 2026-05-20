import { Server, Socket } from 'socket.io'
import { SocketEvents } from '../../types'

interface ChatMessagePayload {
  roomId: string
  content: string
}

interface TypingPayload {
  roomId: string
  isTyping: boolean
}

// Maneja eventos de chat dentro de las salas
export function registerChatHandlers(io: Server, socket: Socket): void {
  // Nuevo mensaje en una sala
  socket.on(SocketEvents.CHAT_MESSAGE, (payload: ChatMessagePayload) => {
    try {
      if (!socket.data.userId || !socket.data.clerkId) {
        socket.emit('error', { message: 'Usuario no autenticado' })
        return
      }

      // Validar que el mensaje no esté vacío
      if (!payload.content || payload.content.trim().length === 0) {
        return
      }

      // Limitar longitud del mensaje para evitar spam
      const content = payload.content.trim().slice(0, 500)

      const messageData = {
        userId: socket.data.userId,
        name: socket.data.userName ?? 'Usuario',
        content,
        roomId: payload.roomId,
        timestamp: new Date().toISOString(),
      }

      // Emitir el mensaje a todos en la sala específica
      // Usamos `to(room)` en lugar de `io.emit` para que solo los usuarios
      // de esa sala reciban el mensaje
      io.to(`room:${payload.roomId}`).emit(SocketEvents.CHAT_MESSAGE_BROADCAST, messageData)
    } catch (error) {
      console.error('[chat.handler] Error en chat:message:', error)
    }
  })

  // Indicador de "está escribiendo..."
  socket.on(SocketEvents.CHAT_TYPING, (payload: TypingPayload) => {
    try {
      if (!socket.data.userId) return

      // Emitir a todos en la sala EXCEPTO al que está escribiendo
      // (el que escribe ya sabe que está escribiendo)
      socket.to(`room:${payload.roomId}`).emit(SocketEvents.CHAT_TYPING_BROADCAST, {
        userId: socket.data.userId,
        name: socket.data.userName ?? 'Usuario',
        isTyping: payload.isTyping,
      })
    } catch (error) {
      console.error('[chat.handler] Error en chat:typing:', error)
    }
  })
}
