# Reglas del Proyecto Kubik

Estas reglas aplican a todo el código del proyecto. Su propósito es mantener el código limpio, mantenible y consistente a lo largo del tiempo.

---

## 1. TypeScript Estricto

- **Siempre** usar TypeScript. Nunca usar archivos `.js` salvo configuraciones (`next.config.js`, `postcss.config.js`).
- Activar `strict: true` en todos los `tsconfig.json`. No hay excepciones.
- **Nunca** usar `any`. Si no se conoce el tipo, usar `unknown` y hacer validación. Si es un caso extremo, justificarlo con un comentario.
- Definir interfaces y tipos en archivos `types/index.ts` de cada módulo. Reutilizar tipos entre capas cuando sea posible.
- Exportar tipos con `export type { ... }` para dejar claro que es solo un tipo.

```typescript
// MAL
const processUser = (user: any) => { ... }

// BIEN
const processUser = (user: User) => { ... }
```

---

## 2. Código Limpio y Modular

- **Una responsabilidad por archivo**: un controlador no hace lógica de negocio, un servicio no sabe nada de HTTP.
- Capas claras en el backend:
  - `routes` → solo define rutas y llama al controller
  - `controllers` → valida input, llama al service, devuelve respuesta HTTP
  - `services` → contiene la lógica de negocio, usa Prisma directamente
  - `socket/handlers` → maneja eventos de WebSocket, llama a services cuando necesita persistencia
- Funciones pequeñas: si una función tiene más de 30 líneas, probablemente hace demasiado. Extraer lógica.
- Nombres descriptivos: `getUsersInRoom` es mejor que `getUsers` o `fetch`.

---

## 3. Comentarios: El POR QUÉ, no el QUÉ

El código debe ser autoexplicativo. Los comentarios explican **por qué** se tomó una decisión, no **qué** hace el código.

```typescript
// MAL: el código ya dice que itera el array
// Iteramos el array de usuarios
users.forEach(user => ...)

// BIEN: explica una decisión no obvia
// Usamos upsert en lugar de create para manejar reconexiones del socket
// sin duplicar usuarios en la base de datos
await prisma.user.upsert(...)
```

Comentar también:
- Workarounds o hacks temporales con `// TODO:` o `// HACK:`
- Lógica de negocio compleja que no es evidente
- Decisiones de arquitectura relevantes dentro del código

---

## 4. Manejo de Errores

- Nunca ignorar errores silenciosamente. Al menos loguear.
- En el backend, usar `try/catch` en todos los controllers y devolver respuestas HTTP apropiadas (400, 401, 404, 500).
- En el frontend, usar `try/catch` en llamadas async y mostrar feedback al usuario.
- Usar Zod para validar datos de entrada en el backend antes de procesarlos.

```typescript
// MAL
const user = await getUser(id) // puede fallar silenciosamente

// BIEN
try {
  const user = await getUser(id)
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
  res.json(user)
} catch (error) {
  console.error('[getUser]', error)
  res.status(500).json({ error: 'Error interno del servidor' })
}
```

---

## 5. Naming Conventions

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Variables y funciones | camelCase | `onlineUsers`, `getUserById` |
| Clases y tipos | PascalCase | `UserService`, `UserStatus` |
| Constantes globales | UPPER_SNAKE_CASE | `MAX_ROOM_CAPACITY` |
| Archivos de componentes | PascalCase | `OnlineUsers.tsx` |
| Archivos de módulos | kebab-case | `auth.middleware.ts` |
| Eventos de Socket | `entidad:accion` | `user:connect`, `chat:message` |

---

## 6. Estructura de Commits

Usar commits atómicos con mensajes descriptivos en formato:

```
tipo(alcance): descripción corta

[cuerpo opcional explicando el POR QUÉ]
```

Tipos: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

Ejemplos:
```
feat(socket): add presence broadcasting on user connect
fix(auth): handle expired Clerk tokens gracefully
refactor(users): extract upsert logic to users.service
```

---

## 7. Seguridad

- **Nunca** commitear archivos `.env`. Siempre usar `.env.example`.
- Validar y sanitizar toda entrada del usuario antes de usarla (Zod en el backend).
- Usar el middleware de autenticación de Clerk en todas las rutas protegidas.
- No exponer stack traces en respuestas de producción.

---

## 8. Performance

- Usar `useMemo` y `useCallback` en React solo cuando haya un problema real de performance medido. No aplicar prematuramente.
- En Socket.io, emitir solo a los sockets que necesitan el evento (room-specific vs broadcast).
- En Prisma, seleccionar solo los campos necesarios con `select: { ... }`.
