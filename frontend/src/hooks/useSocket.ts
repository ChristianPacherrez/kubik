'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { useOfficeStore } from '@/store/office.store'
import type { Socket } from 'socket.io-client'

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
}

// Hook que gestiona el ciclo de vida de la conexión Socket.io
// Se conecta cuando el usuario está autenticado y desconecta al desmontar
export function useSocket(): UseSocketReturn {
  const { getToken, isSignedIn } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const setStoreConnected = useOfficeStore((s) => s.setIsConnected)

  useEffect(() => {
    if (!isSignedIn) return

    let isMounted = true

    async function connect() {
      // Obtener el JWT de Clerk para autenticar el socket
      const token = await getToken()

      if (!token || !isMounted) return

      const socket = getSocket(token)
      socketRef.current = socket

      socket.on('connect', () => {
        if (!isMounted) return
        setIsConnected(true)
        setStoreConnected(true)
        console.log('[useSocket] Conectado:', socket.id)
      })

      socket.on('disconnect', () => {
        if (!isMounted) return
        setIsConnected(false)
        setStoreConnected(false)
        console.log('[useSocket] Desconectado')
      })

      socket.on('connect_error', (error) => {
        console.error('[useSocket] Error de conexión:', error.message)
        setIsConnected(false)
        setStoreConnected(false)
      })
    }

    connect()

    return () => {
      isMounted = false
      // No desconectar aquí porque otros hooks pueden estar usando el socket
      // La desconexión se maneja en el componente raíz de la oficina
    }
  }, [isSignedIn, getToken, setStoreConnected])

  // Limpiar la conexión cuando el componente que usa este hook se desmonta a nivel raíz
  useEffect(() => {
    return () => {
      disconnectSocket()
    }
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
  }
}
