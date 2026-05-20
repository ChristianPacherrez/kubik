import { PrismaClient, RoomType, UserRole, UserStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes para evitar duplicados en re-seeds
  await prisma.userRoom.deleteMany()
  await prisma.user.deleteMany()
  await prisma.room.deleteMany()

  // Crear las salas de la oficina virtual
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        name: 'Lobby',
        maxCapacity: 50,
        type: RoomType.OPEN,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Sala de Reuniones A',
        maxCapacity: 8,
        type: RoomType.MEETING,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Sala de Reuniones B',
        maxCapacity: 4,
        type: RoomType.MEETING,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Zona de Enfoque',
        maxCapacity: 10,
        type: RoomType.FOCUS,
      },
    }),
    prisma.room.create({
      data: {
        name: 'Sala de Descanso',
        maxCapacity: 20,
        type: RoomType.LOUNGE,
      },
    }),
  ])

  console.log(`✓ ${rooms.length} salas creadas`)

  // Crear usuario administrador de prueba
  // En producción, los usuarios se crean via webhook de Clerk al registrarse
  const adminUser = await prisma.user.create({
    data: {
      clerkId: 'user_seed_admin_001',
      email: 'admin@kubik.app',
      name: 'Admin Kubik',
      role: UserRole.HOST,
      status: UserStatus.OFFLINE,
    },
  })

  console.log(`✓ Usuario admin creado: ${adminUser.email}`)

  console.log('\n✅ Seed completado exitosamente')
  console.log('\nSalas disponibles:')
  rooms.forEach(room => {
    console.log(`  - ${room.name} (${room.type}, cap. ${room.maxCapacity})`)
  })
}

main()
  .catch(e => {
    console.error('❌ Error en el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
