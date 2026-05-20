'use client'

// useProfileSync — sincroniza el perfil del usuario local con Supabase
//
// Responsabilidades:
//   1. Upsert en `profiles` al iniciar sesión (nombre, avatar, email, status=AVAILABLE)
//   2. Actualizar status en Supabase INMEDIATAMENTE cuando cambia userStatus
//      → No esperar al heartbeat de 60s: otros usuarios ven el cambio al instante
//   3. Heartbeat last_seen cada 60s (keeps the record "alive" for offline detection)
//   4. Marcar status='OFFLINE' al desmontar (navegar fuera, cerrar pestaña)
//
// Comportamiento si Supabase no está configurado: no-op silencioso.
// Comportamiento si la tabla `profiles` no existe: warn sin romper la app.

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useOfficeStore } from '@/store/office.store'

const HEARTBEAT_MS = 60_000  // 1 min

export function useProfileSync(): void {
  const { user }     = useUser()
  const userStatus   = useOfficeStore((s) => s.userStatus)

  // ── 1. Upsert inicial al montar (login) ────────────────────────────────────
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return

    const userId = user.id

    const upsert = async () => {
      const { error } = await supabase.from('profiles').upsert(
        {
          id:        userId,
          name:      user.fullName ?? user.username ?? 'Usuario',
          avatar_url: user.imageUrl ?? null,
          email:     user.primaryEmailAddress?.emailAddress ?? null,
          status:    'AVAILABLE',
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      if (error) {
        console.warn('[kubik/profiles] upsert failed:', error.message)
      }
    }

    upsert()

    // ── Heartbeat: mantiene last_seen vivo para detección de offline ──────
    const heartbeat = setInterval(async () => {
      const { userStatus: currentStatus } = useOfficeStore.getState()
      await supabase
        .from('profiles')
        .update({ status: currentStatus, last_seen: new Date().toISOString() })
        .eq('id', userId)
    }, HEARTBEAT_MS)

    // ── Cleanup: OFFLINE al desmontar ─────────────────────────────────────
    const markOffline = () => {
      void supabase
        .from('profiles')
        .update({ status: 'OFFLINE', last_seen: new Date().toISOString() })
        .eq('id', userId)
    }

    return () => {
      clearInterval(heartbeat)
      markOffline()
    }
  }, [user])

  // ── 2. Actualizar status en Supabase INMEDIATAMENTE cuando cambia ──────────
  //
  // Separado del efecto de login para que reaccione solo a cambios de status.
  // Esto garantiza que el tab "Equipo" de otros usuarios vea el estado correcto
  // en tiempo real (via postgres_changes en useTeamDirectory) sin esperar el heartbeat.
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return

    void supabase
      .from('profiles')
      .update({ status: userStatus, last_seen: new Date().toISOString() })
      .eq('id', user.id)
  }, [user, userStatus])
}
