// API Route: /api/livekit/token
//
// Genera un JWT de LiveKit para el usuario autenticado con Clerk.
// Llamado por useLiveKitRoom.ts al montar la oficina.
//
// Query params:
//   ?room=office   — nombre de la sala LiveKit (default: "office")
//   ?name=...      — display name (default: userId)

import { AccessToken } from 'livekit-server-sdk'
import { auth }        from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── LiveKit config check ────────────────────────────────────────────────────
  const apiKey    = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret) {
    // Not configured — return 503 so the client can disable voice gracefully
    return NextResponse.json(
      { error: 'LiveKit not configured', code: 'LK_NOT_CONFIGURED' },
      { status: 503 },
    )
  }

  // ── Params ──────────────────────────────────────────────────────────────────
  const { searchParams } = new URL(request.url)
  const room = searchParams.get('room') ?? 'office'
  const name = searchParams.get('name') ?? userId

  // ── Token ───────────────────────────────────────────────────────────────────
  // identity = Clerk userId → permite cruzar datos con el realtimeStore
  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name,
    ttl:      '4h',
  })

  at.addGrant({
    roomJoin:       true,
    room,
    canPublish:     true,
    canSubscribe:   true,
    canPublishData: true,  // future: data messages para sincronizar estado extra
  })

  return NextResponse.json({ token: await at.toJwt() })
}
