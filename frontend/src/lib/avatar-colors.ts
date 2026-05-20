// avatar-colors.ts — Paleta determinística de colores para avatares pixel-art
//
// Un hash djb2 del userId genera skin + hair + outfit de forma estable.
// Los mismos IDs siempre producen los mismos colores en todos los clientes.

// ─── Paletas ──────────────────────────────────────────────────────────────────

/** 6 tonos de piel (claro → oscuro) */
export const SKIN_TONES = [
  { base: '#F5C9B8', dark: '#E0A080' }, // fair
  { base: '#E8A87C', dark: '#C87A50' }, // medium-light
  { base: '#D4896A', dark: '#B06848' }, // medium
  { base: '#C07940', dark: '#966028' }, // medium-dark
  { base: '#8D5524', dark: '#6A3E18' }, // dark
  { base: '#52301A', dark: '#38200C' }, // deep
] as const

/** 6 colores de pelo */
export const HAIR_COLORS = [
  '#2A1E0E', // castaño oscuro
  '#5C3A1E', // castaño
  '#8B5E3C', // castaño claro
  '#181818', // negro
  '#C4974A', // rubio dorado
  '#9AA5B4', // gris / silver
] as const

/** 6 paletas de ropa — muted, profesionales */
export const OUTFIT_PALETTES = [
  { shirt: '#3D3A7A', pants: '#252250', dark: '#2D2A5A' }, // indigo  (brand)
  { shirt: '#2A4A48', pants: '#1C3230', dark: '#1E3836' }, // teal
  { shirt: '#36404E', pants: '#242E3A', dark: '#2A3040' }, // slate
  { shirt: '#5A2A38', pants: '#3A1E2A', dark: '#4A2030' }, // rose
  { shirt: '#5A4020', pants: '#3A2A14', dark: '#4A3218' }, // amber
  { shirt: '#4A2A6A', pants: '#2E1A48', dark: '#3C2058' }, // violet
] as const

// ─── Tipos exportados ────────────────────────────────────────────────────────

export type SkinTone    = typeof SKIN_TONES[number]
export type HairColor   = typeof HAIR_COLORS[number]
export type OutfitPalette = typeof OUTFIT_PALETTES[number]

export interface AvatarColors {
  skin:   SkinTone
  hair:   HairColor
  outfit: OutfitPalette
}

// ─── Hash determinístico ──────────────────────────────────────────────────────

function djb2(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) & 0x7fffffff
  }
  return Math.abs(h)
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Genera colores determinísticos para un avatar dado su userId (o nombre).
 * Los mismos parámetros siempre producen los mismos colores.
 */
export function getAvatarColors(seed: string): AvatarColors {
  const h = djb2(seed)
  return {
    skin:   SKIN_TONES  [h          % SKIN_TONES.length],
    hair:   HAIR_COLORS [(h >> 4)   % HAIR_COLORS.length],
    outfit: OUTFIT_PALETTES[(h >> 8) % OUTFIT_PALETTES.length],
  }
}

/** El jugador local siempre usa indigo (color de marca Kubik) */
export const PLAYER_OUTFIT: OutfitPalette = OUTFIT_PALETTES[0]
