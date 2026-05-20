import { Router } from 'express'
import usersRouter from './users.route'

const router = Router()

// Health check — útil para saber si el servidor está vivo sin auth
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

router.use('/users', usersRouter)

export default router
