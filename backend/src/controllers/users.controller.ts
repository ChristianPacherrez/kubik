import { Request, Response } from 'express'
import { z } from 'zod'
import * as usersService from '../services/users.service'
import { UserStatus } from '../types'

// GET /api/users — lista de usuarios online
export async function listOnlineUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await usersService.getOnlineUsers()
    res.json(users)
  } catch (error) {
    console.error('[usersController.listOnlineUsers]', error)
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
}

// GET /api/users/:id — obtener usuario por ID
export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    if (!id) {
      res.status(400).json({ error: 'ID requerido' })
      return
    }

    const user = await usersService.getUserById(id)

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }

    res.json(user)
  } catch (error) {
    console.error('[usersController.getUserById]', error)
    res.status(500).json({ error: 'Error al obtener usuario' })
  }
}

// PATCH /api/users/:id/status — actualizar estado del usuario
const updateStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
})

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    if (!id) {
      res.status(400).json({ error: 'ID requerido' })
      return
    }

    // Validar el body con Zod antes de procesar
    const result = updateStatusSchema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        error: 'Estado inválido',
        details: result.error.flatten(),
      })
      return
    }

    // Solo el propio usuario puede cambiar su estado
    // Comparamos clerkId del token con el usuario a actualizar
    const targetUser = await usersService.getUserById(id)
    if (!targetUser) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }

    if (targetUser.clerkId !== req.userId) {
      res.status(403).json({ error: 'No puedes cambiar el estado de otro usuario' })
      return
    }

    const updatedUser = await usersService.updateUserStatus(id, result.data.status)
    res.json(updatedUser)
  } catch (error) {
    console.error('[usersController.updateUserStatus]', error)
    res.status(500).json({ error: 'Error al actualizar estado' })
  }
}
