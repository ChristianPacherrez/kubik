// Cargar env primero, antes de importar cualquier módulo que los use
import './config/env'

import http from 'http'
import app from './app'
import { createSocketServer } from './socket'
import { env } from './config/env'
import prisma from './config/database'

async function main() {
  // Verificar conexión a la base de datos antes de arrancar
  try {
    await prisma.$connect()
    console.log('✓ Conexión a PostgreSQL establecida')
  } catch (error) {
    console.error('✗ No se pudo conectar a PostgreSQL:', error)
    process.exit(1)
  }

  // Crear el servidor HTTP que comparte Express y Socket.io
  // Ambos deben usar el mismo servidor HTTP para que Socket.io funcione
  const httpServer = http.createServer(app)

  // Inicializar Socket.io sobre el mismo servidor HTTP
  createSocketServer(httpServer)

  httpServer.listen(env.PORT, () => {
    console.log(`✓ Servidor Kubik corriendo en puerto ${env.PORT}`)
    console.log(`  API: http://localhost:${env.PORT}/api`)
    console.log(`  Health: http://localhost:${env.PORT}/api/health`)
    console.log(`  Entorno: ${env.NODE_ENV}`)
  })

  // Graceful shutdown — cerrar la BD antes de salir
  process.on('SIGTERM', async () => {
    console.log('\nCerrando servidor...')
    await prisma.$disconnect()
    process.exit(0)
  })
}

main().catch(error => {
  console.error('Error fatal al iniciar el servidor:', error)
  process.exit(1)
})
