import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { env } from './config/env'
import apiRouter from './routes'

const app = express()

// Helmet añade headers de seguridad HTTP (Content-Security-Policy, X-XSS-Protection, etc.)
app.use(helmet())

// CORS configurado solo para el frontend — rechaza requests de otros orígenes
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true, // Necesario para enviar cookies/headers de auth
  })
)

// Parsear bodies JSON — limitar tamaño para evitar ataques de payload grande
app.use(express.json({ limit: '10kb' }))

// Todas las rutas de la API bajo /api
app.use('/api', apiRouter)

// Ruta catch-all para endpoints no existentes
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

export default app
