# Estructura de la Base de Datos — Kubik

Diseño de la base de datos PostgreSQL con Prisma ORM.

---

## ¿Por qué PostgreSQL + Prisma?

**PostgreSQL:**
- Base de datos relacional robusta y gratuita.
- Soporta JSON nativo (útil para guardar configuraciones y posiciones).
- Excelente para relaciones complejas (usuarios, salas, mensajes).

**Prisma:**
- ORM con TypeScript nativo — el esquema genera los tipos automáticamente.
- Migraciones automáticas y versionadas.
- Prisma Studio — interfaz visual para ver/editar datos en desarrollo.
- Consultas con autocomplete en el editor.

---

## Esquema completo

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

enum UserRole {
  HOST           // administrador de la instancia
  ADMIN          // admin de organización
  COLLABORATOR   // usuario estándar (por defecto)
}

enum UserStatus {
  AVAILABLE   // verde — disponible para hablar
  BUSY        // amarillo — ocupado, no molestar
  IN_MEETING  // rojo — en reunión
  AWAY        // gris — ausente / inactivo
}

enum RoomType {
  LOBBY       // sala de entrada, todos ven a todos
  MEETING     // sala de reuniones, capacidad limitada
  LOUNGE      // área de descanso informal
  FOCUS       // zona de trabajo enfocado, silencio
}

// ─────────────────────────────────────────
// MODELOS
// ─────────────────────────────────────────

model User {
  id         String      @id @default(cuid())
  clerkId    String      @unique  // ID de Clerk, fuente de verdad para auth
  email      String      @unique
  name       String
  avatarUrl  String?
  role       UserRole    @default(COLLABORATOR)
  status     UserStatus  @default(AVAILABLE)
  isOnline   Boolean     @default(false)
  lastSeen   DateTime    @default(now())
  xp         Int         @default(0)          // puntos de experiencia (Fase 7)
  level      Int         @default(1)          // nivel calculado del XP
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  // Relaciones
  userRooms  UserRoom[]
  messages   Message[]
  achievements UserAchievement[]

  @@map("users")
}

model Room {
  id           String    @id @default(cuid())
  name         String
  slug         String    @unique   // "lobby", "meeting-1" — usado en Socket.io rooms
  type         RoomType  @default(LOBBY)
  description  String?
  maxCapacity  Int       @default(20)
  isActive     Boolean   @default(true)
  // Configuración JSON — posición en el mapa, color, icono, etc.
  config       Json      @default("{}")
  createdAt    DateTime  @default(now())

  // Relaciones
  userRooms    UserRoom[]
  messages     Message[]

  @@map("rooms")
}

// Tabla de unión: qué usuarios están en qué sala AHORA
// Se limpia cuando el usuario se desconecta
model UserRoom {
  id       String   @id @default(cuid())
  userId   String
  roomId   String
  joinedAt DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  room     Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@unique([userId, roomId])
  @@map("user_rooms")
}

// Mensajes de chat (persistidos para historial)
model Message {
  id        String   @id @default(cuid())
  content   String
  userId    String
  roomId    String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@index([roomId, createdAt])  // optimiza la query de historial
  @@map("messages")
}

// Logros desbloqueados por usuario (Fase 7)
model UserAchievement {
  id            String   @id @default(cuid())
  userId        String
  achievementId String   // referencia al catálogo de logros (en código, no en BD)
  unlockedAt    DateTime @default(now())

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
  @@map("user_achievements")
}
```

---

## Relaciones entre modelos

```
User (1) ──────────── (N) UserRoom (N) ──────────── (1) Room
  │                                                        │
  │ (1)                                                    │ (1)
  │                                                        │
  └──── (N) Message ──── (N) ──────────────────────────────┘
  │
  └──── (N) UserAchievement
```

---

## Queries más frecuentes

### Usuarios online

```typescript
// Todos los usuarios conectados ahora mismo
const onlineUsers = await prisma.user.findMany({
  where: { isOnline: true },
  select: { id: true, name: true, avatarUrl: true, status: true, role: true },
  orderBy: { name: 'asc' },
})
```

### Historial de chat de una sala

```typescript
// Últimos 50 mensajes de una sala, ordenados del más antiguo al más reciente
const messages = await prisma.message.findMany({
  where: { room: { slug: roomSlug } },
  include: {
    user: { select: { name: true, avatarUrl: true } },
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
})
messages.reverse()  // invertir para mostrar del más antiguo arriba
```

### Upsert de usuario al conectarse

```typescript
// Crea el usuario si no existe, actualiza si ya existe
const user = await prisma.user.upsert({
  where: { clerkId },
  update: { isOnline: true, lastSeen: new Date(), name, avatarUrl },
  create: { clerkId, email, name, avatarUrl, isOnline: true },
})
```

---

## Comandos de base de datos

```bash
# Generar el cliente Prisma (correr después de cambiar schema.prisma)
cd backend && pnpm db:generate

# Crear migración y aplicarla
cd backend && pnpm db:migrate

# Abrir Prisma Studio (interfaz visual)
cd backend && pnpm db:studio

# Poblar con datos de prueba
cd backend && pnpm db:seed
```

---

## Datos de seed (prueba)

El archivo `backend/prisma/seed.ts` crea:

| Tipo | Cantidad | Detalle |
|------|----------|---------|
| Rooms | 5 | Lobby, Sala de Reuniones, Zona Focus, Área Social, Sala Creativa |
| Users | 1 | Admin de prueba (se puede expandir) |

Las salas se crean con el slug que coincide con los rooms de Socket.io.

---

## Índices de performance

```prisma
// Índice en Message para queries de historial por sala (muy frecuente)
@@index([roomId, createdAt])

// Índice implícito en User.clerkId y User.email por el @unique
// Índice implícito en Room.slug por el @unique
```

Para producción con > 1000 usuarios, considerar:
- Índice en `User.isOnline` para la query de usuarios online
- Particionamiento de `Message` por fecha si hay mucho volumen
