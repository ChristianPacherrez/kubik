# Arquitectura de Kubik

## Visión General

Kubik es una oficina virtual gamificada construida sobre una arquitectura cliente-servidor con comunicación en tiempo real via WebSockets. La separación clara entre frontend y backend permite escalar cada capa de forma independiente.

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTE                            │
│                                                         │
│  Next.js 14 (App Router)                                │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Clerk Auth │  │  Phaser.js   │  │  Socket.io    │  │
│  │  (UI + JWT) │  │  (Mapa 2D)   │  │  (WebSocket)  │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP + WebSocket
┌────────────────────────▼────────────────────────────────┐
│                      SERVIDOR                           │
│                                                         │
│  Express + Socket.io (Node.js)                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Clerk SDK  │  │  REST API    │  │  Socket.io    │  │
│  │  (JWT verify│  │  (Express)   │  │  (Handlers)   │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│                           │                             │
│                    ┌──────▼──────┐                      │
│                    │   Prisma    │                      │
│                    │   (ORM)     │                      │
│                    └──────┬──────┘                      │
└───────────────────────────┼─────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │  PostgreSQL   │
                    └───────────────┘
```

---

## Decisiones de Arquitectura

### Por qué Next.js 14 (App Router)

Next.js con el App Router ofrece Server Components y un modelo de routing basado en el filesystem que reduce el boilerplate. Para Kubik, las páginas de autenticación y landing pueden ser renderizadas en el servidor (mejor SEO y performance inicial), mientras que la oficina virtual corre completamente en el cliente (necesario para Phaser.js y Socket.io).

El patrón de Route Groups `(auth)` y `(office)` permite layouts diferenciados sin afectar las URLs, ideal para separar la experiencia de onboarding del espacio de trabajo.

### Por qué Express + Socket.io (y no Next.js API Routes)

Las API Routes de Next.js son serverless y no mantienen estado entre peticiones. Socket.io **requiere un servidor con estado persistente** para mantener las conexiones WebSocket abiertas y rastrear qué usuarios están en qué salas.

Express permite un servidor de larga duración donde Socket.io puede mantener el estado de presencia en memoria y sincronizarlo con la base de datos cuando sea necesario.

### Por qué Clerk (y no NextAuth o Auth.js)

Clerk ofrece:
- UI de autenticación lista para usar (sign-in, sign-up, user profiles)
- JWTs que se pueden verificar en el backend con el SDK oficial
- Webhooks para sincronizar usuarios a nuestra base de datos
- OAuth con Google/GitHub sin configuración extra

Lo más importante para Kubik: el token JWT de Clerk se puede enviar en el handshake de Socket.io, permitiendo autenticar conexiones WebSocket de forma sencilla y segura.

### Por qué Prisma (y no Sequelize o consultas raw)

Prisma genera tipos TypeScript automáticamente desde el schema, lo que elimina una clase entera de bugs en tiempo de compilación. El Prisma Studio es útil durante el desarrollo para inspeccionar la base de datos visualmente.

El schema declarativo en `schema.prisma` también sirve como documentación viva del modelo de datos.

### Por qué Phaser.js (y no Three.js o canvas manual)

Kubik necesita un mapa 2D isométrico o top-down con sprites animados, colisiones y movimiento de avatares. Phaser.js está diseñado exactamente para esto: tiene soporte nativo para tilemaps (Tiled), physics, sprites y animaciones.

Three.js sería excesivo para 2D y requeriría mucho más código para lograr lo mismo. El canvas manual sería reinventar la rueda.

### Por qué Zustand (y no Redux o Context)

Para el estado del cliente (usuarios online, mensajes, sala actual), Zustand ofrece una API mínima sin boilerplate. El estado de la oficina es relativamente simple: no necesitamos el overhead de Redux. Zustand también tiene excelente integración con React y soporte para Immer si el estado crece en complejidad.

---

## Flujo de Autenticación

```
1. Usuario llega a / (landing page)
2. Click en "Entrar" → redirige a /sign-in (Clerk UI)
3. Clerk autentica → redirige a /office
4. /office layout llama auth() de Clerk en el servidor
   - Si no autenticado → redirect a /sign-in
   - Si autenticado → renderiza la página
5. Componente cliente obtiene token JWT de Clerk
6. Conecta Socket.io con el JWT en el handshake
7. Backend verifica JWT con Clerk SDK
8. Si válido → conexión establecida, usuario upserted en DB
```

---

## Flujo de Presencia en Tiempo Real

```
1. Socket conecta con JWT válido
2. Backend hace upsert del usuario en PostgreSQL
3. Backend emite 'presence:update' a todos los clientes con la lista actualizada
4. Cuando el usuario cierra pestaña/socket se desconecta
5. Backend marca usuario como OFFLINE y emite 'presence:update' de nuevo
```

---

## Plan de Desarrollo por Fases

Ver detalle completo en [phases.md](phases.md).

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Arquitectura base (este setup) | ✅ |
| 2 | Autenticación con Clerk | 🔄 |
| 3 | Presencia en tiempo real | ⏳ |
| 4 | Mapa virtual con Phaser | ⏳ |
| 5 | Chat en tiempo real | ⏳ |
| 6 | Salas de reuniones | ⏳ |
| 7 | Gamificación | ⏳ |
