import { Request, Response, NextFunction } from 'express'
import { clerkClient, verifyToken } from '@clerk/clerk-sdk-node'
import { env } from '../config/env'

// Middleware de autenticación que verifica el JWT de Clerk
// Extrae el userId del token y lo adjunta al request para uso en controllers
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación requerido' })
    return
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Token inválido' })
    return
  }

  try {
    // Verificar el JWT usando la secret key de Clerk
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    })

    // Adjuntar el userId al request para que los controllers lo puedan usar
    req.userId = payload.sub

    next()
  } catch (error) {
    // El token puede ser inválido por expiración, firma incorrecta, etc.
    console.error('[auth.middleware] Token inválido:', error)
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

// Versión del middleware para Socket.io — verifica el token del handshake
export async function verifySocketToken(token: string): Promise<string | null> {
  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    })
    return payload.sub
  } catch {
    return null
  }
}
