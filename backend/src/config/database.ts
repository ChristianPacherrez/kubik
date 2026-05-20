import { PrismaClient } from '@prisma/client'

// Singleton del cliente de Prisma
// En desarrollo, Next.js hot reload puede crear múltiples instancias,
// por eso guardamos la instancia en globalThis para reutilizarla
declare global {
  // eslint-disable-next-line no-var
  var prismaInstance: PrismaClient | undefined
}

const prisma: PrismaClient =
  globalThis.prismaInstance ??
  new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'warn', 'error'] : ['error'],
  })

if (process.env['NODE_ENV'] !== 'production') {
  globalThis.prismaInstance = prisma
}

export default prisma
