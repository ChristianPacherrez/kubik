import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { env } from '../config/env'
import { verifySocketToken } from '../middleware/auth.middleware'
import { registerPresenceHandlers } from './handlers/presence.handler'
import { registerChatHandlers } from './handlers/chat.handler'

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Middleware de autenticación para Socket.io
  // Se ejecuta en el handshake inicial antes de establecer la conexión
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined

    if (!token) {
      return next(new Error('Token de autenticación requerido'))
    }

    const clerkId = await verifySocketToken(token)

    if (!clerkId) {
      return next(new Error('Token inválido o expirado'))
    }

    // Guardar el clerkId verificado en el socket para uso en handlers
    socket.data.clerkId = clerkId
    next()
  })

  io.on('connection', (socket: Socket) => {
    console.log(`[socket] Nueva conexión: ${socket.id}`)

    // Registrar todos los handlers de eventos para este socket
    registerPresenceHandlers(io, socket)
    registerChatHandlers(io, socket)
  })

  return io
}
