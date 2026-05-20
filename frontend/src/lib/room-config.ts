// room-config.ts — identidad, actividad y widgets de cada sala
//
// Esta capa es ESTÁTICA — no cambia en runtime.
// Define la personalidad de cada sala: propósito, atmósfera, widgets disponibles.
// Se cruza con OFFICE_ZONES (que tiene el estilo visual) vía zone.type.

import { ZoneType } from './mock-data'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type WidgetType = 'notes' | 'tasks' | 'links'

export type ActivityType =
  | 'open'     // Lobby — paso libre
  | 'focus'    // Trabajo profundo
  | 'social'   // Descanso y conversación
  | 'meeting'  // Reunión formal
  | 'collab'   // Co-creación activa
  | 'support'  // Atención al cliente

export interface RoomConfig {
  type:         ZoneType
  activityType: ActivityType
  label:        string          // "Meeting Room", "Deep Work Zone", etc.
  atmosphere:   string          // Una frase que define la vibe
  widgets:      WidgetType[]    // Widgets disponibles (en orden de tabs)
  statusOptions: string[]       // Estados rápidos que el equipo puede poner
  rules?:        string[]       // Normas cortas (opcional)
}

// ─── Configuración por zona ───────────────────────────────────────────────────

export const ROOM_CONFIGS: Record<ZoneType, RoomConfig> = {
  lobby: {
    type:         'lobby',
    activityType: 'open',
    label:        'Open Space',
    atmosphere:   'Entrada principal. Pasa, saluda al equipo, comparte novedades.',
    widgets:      ['notes', 'links'],
    statusOptions: ['Libre 👋', 'Anuncio importante 📢', 'Reunión pronto 🔔'],
  },

  focus: {
    type:         'focus',
    activityType: 'focus',
    label:        'Deep Work',
    atmosphere:   'Zona de concentración máxima. Respeta el silencio.',
    widgets:      ['tasks', 'notes'],
    statusOptions: ['Focus mode 🎯', 'No interrumpir 🔕', 'Disponible en 30 min ⏱'],
    rules: ['Modo DND recomendado', 'Sin interrupciones de voz', 'Mensajes asíncronos'],
  },

  lounge: {
    type:         'lounge',
    activityType: 'social',
    label:        'Social Lounge',
    atmosphere:   'Descansa, toma café virtual. Conversación casual bienvenida.',
    widgets:      ['notes', 'links'],
    statusOptions: ['Café ☕', 'Lunch break 🍱', 'Charla libre 💬', 'Viernes casual 🎉'],
  },

  meeting: {
    type:         'meeting',
    activityType: 'meeting',
    label:        'Meeting Room',
    atmosphere:   'Reuniones formales, demos y retrospectivas.',
    widgets:      ['tasks', 'notes', 'links'],
    statusOptions: [
      'Reunión activa 🔴', 'Sprint Review 📊',
      'Demo cliente 🎯',   'Retrospectiva 🔄',
      'Sala libre ✅',
    ],
  },

  collab: {
    type:         'collab',
    activityType: 'collab',
    label:        'Collab Zone',
    atmosphere:   'Pair programming, brainstorm y co-creación en tiempo real.',
    widgets:      ['tasks', 'notes', 'links'],
    statusOptions: [
      'Pair programming 👨‍💻', 'Brainstorm 🧠',
      'Code review 🔍',        'Libre ✅',
    ],
  },

  support: {
    type:         'support',
    activityType: 'support',
    label:        'Support Hub',
    atmosphere:   'Atención al cliente e incidencias activas.',
    widgets:      ['tasks', 'links'],
    statusOptions: ['Alta demanda 🔴', 'Tickets abiertos 📋', 'Sin cola ✅'],
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getRoomConfig(type: ZoneType | string): RoomConfig {
  return ROOM_CONFIGS[type as ZoneType] ?? ROOM_CONFIGS.lobby
}

/** Icono del tipo de actividad — para badges y estados */
export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  open:    '🏠',
  focus:   '🎯',
  social:  '☕',
  meeting: '📋',
  collab:  '⚡',
  support: '🛠',
}
