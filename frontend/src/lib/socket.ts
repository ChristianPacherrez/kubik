import { io } from 'socket.io-client'

// Socket inicializado de forma lazy — solo cuando el usuario está autenticado
// Mantener una sola instancia para evitar conexiones duplicadas
let socket: ReturnType<typeof io> | null = null

export const getSocket = (token: string) => {
  // Si ya existe una instancia conectada, reutilizarla
  // Esto previene crear múltiples conexiones en re-renders de React
  if (socket && socket.connected) {
    return socket
  }

  // Si hay una instancia desconectada, limpiarla antes de crear una nueva
  if (socket) {
    socket.disconnect()
    socket = null
  }

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
    auth: { token },
    transports: ['websocket'], // Usar solo WebSocket, evitar long-polling para mejor performance
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  return socket
}

// Obtener la instancia actual sin crear una nueva
export const getCurrentSocket = () => socket

// Desconectar y limpiar la instancia
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
