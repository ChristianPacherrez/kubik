# API Documentation - Kubik

> **Estado**: Documentación en construcción. Se irá completando por fases.

## Base URL

```
http://localhost:3001/api
```

Todas las rutas protegidas requieren el header:
```
Authorization: Bearer <clerk_jwt_token>
```

---

## Endpoints REST

### Users

#### `GET /api/users`
Retorna la lista de usuarios actualmente online.

**Headers**: Authorization requerido

**Response 200**:
```json
[
  {
    "id": "cuid...",
    "clerkId": "user_...",
    "name": "Ana García",
    "email": "ana@empresa.com",
    "avatarUrl": "https://...",
    "role": "COLLABORATOR",
    "status": "AVAILABLE"
  }
]
```

---

#### `GET /api/users/:id`
Retorna un usuario por su ID interno.

**Params**: `id` — ID del usuario en la base de datos

**Response 200**: objeto User
**Response 404**: `{ "error": "Usuario no encontrado" }`

---

#### `PATCH /api/users/:id/status`
Actualiza el estado de presencia del usuario.

**Body**:
```json
{
  "status": "BUSY" // AVAILABLE | BUSY | IN_MEETING | AWAY
}
```

**Response 200**: objeto User actualizado
**Response 400**: `{ "error": "Estado inválido" }`

---

## Eventos de Socket.io

### Eventos que el cliente EMITE

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `user:connect` | `{ clerkId, name, email, avatarUrl }` | Al conectar, registra al usuario |
| `user:status` | `{ status: UserStatus }` | Cambia el estado del usuario |
| `chat:message` | `{ roomId, content }` | Envía un mensaje al room actual |
| `chat:typing` | `{ roomId, isTyping }` | Indica si el usuario está escribiendo |
| `player:move` | `{ x, y, direction }` | Actualiza posición del avatar en el mapa |

### Eventos que el cliente RECIBE

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `presence:update` | `User[]` | Lista completa de usuarios online |
| `chat:message` | `{ userId, name, content, timestamp }` | Nuevo mensaje en el room |
| `chat:typing` | `{ userId, name, isTyping }` | Otro usuario está escribiendo |
| `player:moved` | `{ userId, x, y, direction }` | Avatar de otro usuario se movió |

---

## Modelos de Datos

### User
```typescript
{
  id: string          // CUID generado por Prisma
  clerkId: string     // ID del usuario en Clerk (unique)
  email: string
  name: string
  avatarUrl: string | null
  role: 'HOST' | 'ADMIN' | 'COLLABORATOR'
  status: 'AVAILABLE' | 'BUSY' | 'IN_MEETING' | 'AWAY' | 'OFFLINE'
  createdAt: Date
}
```

### Room
```typescript
{
  id: string
  name: string
  maxCapacity: number
  type: 'OPEN' | 'MEETING' | 'FOCUS' | 'LOUNGE'
}
```
