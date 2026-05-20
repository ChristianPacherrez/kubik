// lib/interaction-events.ts — Transport layer de interacciones peer-to-peer
//
// Usa LiveKit Data Channels como transporte (ya establecidos por el voice room).
// Patrón: module-level handler registry, igual que _positionListeners en realtime.store.
//
// Flujo de datos:
//   Send:    sendInteractionEvent(event, [targetIds?]) → publishData → LiveKit → peers
//   Receive: lib/livekit.ts DataReceived → dispatchInteractionEvent → handlers registrados
//
// Añadir un evento nuevo: 1) extender InteractionEvent, 2) añadir handler en useInteractionEvents

import { getLiveKitRoom } from './livekit'
import { usePlayerStore } from '@/store/player.store'

// ─── Event types (discriminated union) ────────────────────────────────────────

interface BaseEvent {
  /** Clerk userId del emisor = LiveKit identity */
  fromId:       string
  fromName:     string
  fromAvatarUrl: string | null
}

export type InteractionEvent =
  | (BaseEvent & { type: 'knock'        })
  | (BaseEvent & { type: 'message';       text: string; messageId: string; timestamp: number })
  | (BaseEvent & { type: 'typing_start' })
  | (BaseEvent & { type: 'typing_stop'  })
  | (BaseEvent & { type: 'call_request' })
  | (BaseEvent & { type: 'call_accept'  })
  | (BaseEvent & { type: 'call_decline' })
  | (BaseEvent & { type: 'call_end'     })

export type InteractionEventType = InteractionEvent['type']

/**
 * Distributive Omit — preserva cada miembro del union al hacer Omit.
 * `Omit<UnionType, K>` colapsa la union; este helper la mantiene abierta.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/** Payload que el caller pasa a sendInteractionEvent (sin los campos from*) */
export type InteractionPayload = DistributiveOmit<InteractionEvent, 'fromId' | 'fromName' | 'fromAvatarUrl'>

// ─── Handler registry ─────────────────────────────────────────────────────────
//
// Componentes/hooks registran handlers aquí. No requieren Context ni React.
// Se registran antes de que la Room conecte → nunca pierden eventos.

type EventHandler = (event: InteractionEvent) => void

const _handlers = new Map<InteractionEventType, Set<EventHandler>>()

/**
 * Registrar un handler para uno o más tipos de evento.
 * Devuelve la función de limpieza (para useEffect return).
 */
export function onInteractionEvent(
  types: InteractionEventType | InteractionEventType[],
  fn:    EventHandler,
): () => void {
  const list = Array.isArray(types) ? types : [types]
  list.forEach((t) => {
    if (!_handlers.has(t)) _handlers.set(t, new Set())
    _handlers.get(t)!.add(fn)
  })
  return () => {
    list.forEach((t) => _handlers.get(t)?.delete(fn))
  }
}

/**
 * Despachar un evento recibido de la red al handler correspondiente.
 * Llamado por lib/livekit.ts en RoomEvent.DataReceived.
 */
export function dispatchInteractionEvent(event: InteractionEvent): void {
  _handlers.get(event.type)?.forEach((fn) => fn(event))
}

// ─── Sender ───────────────────────────────────────────────────────────────────

/**
 * Enviar un evento de interacción al/los peer(s) indicados vía LiveKit Data Channel.
 *
 * @param partial  Los campos del evento sin fromId/fromName/fromAvatarUrl (se añaden auto)
 * @param targetIds  undefined = broadcast a todos; array = solo esos peers (identities)
 */
export async function sendInteractionEvent(
  partial:   InteractionPayload,
  targetIds?: string[],
): Promise<void> {
  const room = getLiveKitRoom()
  if (!room) {
    console.warn('[InteractionEvents] Room no conectada — evento descartado:', partial.type)
    return
  }

  const player = usePlayerStore.getState()
  // Construir el evento completo: campos from* del player local + payload enviado
  const event = {
    fromId:        room.localParticipant.identity,
    fromName:      player.name,
    fromAvatarUrl: player.avatarUrl,
    ...partial,
  } as unknown as InteractionEvent

  const payload = new TextEncoder().encode(JSON.stringify(event))

  try {
    await room.localParticipant.publishData(payload, {
      reliable:               true,
      destinationIdentities:  targetIds,
    })
  } catch (err) {
    console.warn('[InteractionEvents] publishData falló:', err)
  }
}

// ─── Helpers de parsing (usados por livekit.ts) ───────────────────────────────

/**
 * Intentar parsear un Uint8Array como InteractionEvent.
 * Devuelve null si el payload no es JSON válido o no tiene 'type' reconocido.
 */
const VALID_TYPES = new Set<string>([
  'knock', 'message', 'typing_start', 'typing_stop',
  'call_request', 'call_accept', 'call_decline', 'call_end',
])

export function parseInteractionPayload(payload: Uint8Array): InteractionEvent | null {
  try {
    const text  = new TextDecoder().decode(payload)
    const event = JSON.parse(text) as Record<string, unknown>
    if (typeof event.type !== 'string' || !VALID_TYPES.has(event.type)) return null
    return event as unknown as InteractionEvent
  } catch {
    return null
  }
}
