import { create } from 'zustand'
import { User, Message, Room, UserStatus } from '@/types'

interface OfficeState {
  // Lista de usuarios actualmente online en la oficina
  onlineUsers: User[]
  // Sala en la que se encuentra el usuario actual
  currentRoom: Room | null
  // Mensajes del chat de la sala actual
  messages: Message[]
  // Estado de presencia del usuario actual
  userStatus: UserStatus
  // Si el socket está conectado
  isConnected: boolean
  // Zona seleccionada en el mapa interactivo (null = ninguna)
  selectedZoneId: string | null

  // Acciones
  setOnlineUsers: (users: User[]) => void
  setCurrentRoom: (room: Room | null) => void
  addMessage: (message: Message) => void
  setUserStatus: (status: UserStatus) => void
  setIsConnected: (connected: boolean) => void
  clearMessages: () => void
  setSelectedZone: (id: string | null) => void
}

export const useOfficeStore = create<OfficeState>((set) => ({
  onlineUsers: [],
  currentRoom: null,
  messages: [],
  userStatus: UserStatus.AVAILABLE,
  isConnected: false,
  selectedZoneId: null,

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  setCurrentRoom: (room) =>
    set((state) => ({
      currentRoom: room,
      // Limpiar mensajes al cambiar de sala para no mezclar historiales
      messages: state.currentRoom?.id !== room?.id ? [] : state.messages,
    })),

  addMessage: (message) =>
    set((state) => ({
      // Limitar el historial en memoria a 100 mensajes para no consumir demasiada RAM
      messages: [...state.messages.slice(-99), message],
    })),

  setUserStatus: (status) => set({ userStatus: status }),

  setIsConnected: (connected) => set({ isConnected: connected }),

  clearMessages: () => set({ messages: [] }),

  setSelectedZone: (id) => set({ selectedZoneId: id }),
}))
