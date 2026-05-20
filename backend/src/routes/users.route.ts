import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import * as usersController from '../controllers/users.controller'

const router = Router()

// Todas las rutas de usuarios requieren autenticación
router.use(requireAuth)

router.get('/', usersController.listOnlineUsers)
router.get('/:id', usersController.getUserById)
router.patch('/:id/status', usersController.updateUserStatus)

export default router
