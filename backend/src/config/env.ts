import dotenv from 'dotenv'

// Cargar el .env antes de cualquier otra cosa
dotenv.config()

// Validar variables de entorno requeridas al inicio para fallar rápido
// en lugar de hacerlo cuando se usen por primera vez
function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Variable de entorno requerida no configurada: ${key}`)
  }
  return value
}

export const env = {
  PORT: parseInt(process.env['PORT'] ?? '3001', 10),
  DATABASE_URL: requireEnv('DATABASE_URL'),
  CLERK_SECRET_KEY: requireEnv('CLERK_SECRET_KEY'),
  FRONTEND_URL: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
}
