// supabase.ts — cliente singleton para Supabase Realtime
//
// Solo Realtime — no DB, no Supabase Auth (Clerk gestiona auth).
//
// Soporta dos nombres de key:
//   · NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  (nuevo formato — sb_publishable_...)
//   · NEXT_PUBLIC_SUPABASE_ANON_KEY         (formato legacy — eyJhbGci...)

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''

/** true si las credenciales están configuradas en .env.local */
export const isSupabaseConfigured = Boolean(url) && Boolean(key)

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    '[kubik/supabase] Credenciales no configuradas — modo offline activo.\n' +
    '  Añade NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local'
  )
}

// Singleton — una sola instancia aunque el módulo se importe en múltiples sitios
let _client: SupabaseClient | null = null

function buildClient(): SupabaseClient {
  return createClient(
    url  || 'https://placeholder.supabase.co',
    key  || 'placeholder',
    {
      realtime: {
        params: { eventsPerSecond: 10 }, // Presence no necesita más
      },
      auth: {
        persistSession:     false,
        autoRefreshToken:   false,
        detectSessionInUrl: false,
      },
    }
  )
}

export function getSupabase(): SupabaseClient {
  if (!_client) _client = buildClient()
  return _client
}

// Acceso directo al singleton (equivalente a importar un módulo singleton)
export const supabase = getSupabase()
