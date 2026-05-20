// lib/ui-sounds.ts — Sistema de sonidos UI con Web Audio API
//
// Sin archivos de audio externos — todo sintético en el browser.
// Diseño de sonido: moderno, social, office-grade.
//
// Principios de diseño:
//   · Knock   → percusivo y reconocible ("toc-toc"), no un sweep de frecuencia
//   · Llamar  → arpeggio ascendente (Do-Mi-Sol) × N, como ringtone moderno
//   · Mensaje → ding suave de doble tono (agradable, breve)
//   · Accept  → chord positivo, cálido
//   · Decline → descenso sutil, neutral
//
// Ganancias calibradas para ser notorias SIN ser agresivas:
//   Knock: 0.28 peak   (era 0.11 — casi inaudible)
//   Call:  0.26 peak   (era 0.08 — inaudible)
//   Msg:   0.16 peak   (era 0.06 — casi inaudible)
//
// Singleton lazy — AudioContext solo se crea tras la primera interacción del usuario.

class UISoundManager {
  private ctx: AudioContext | null = null

  // ─── AudioContext ─────────────────────────────────────────────────────────

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  // ─── Primitivos de síntesis ───────────────────────────────────────────────

  /**
   * Tono simple: oscilador + envolvente de ganancia.
   * @param type      tipo de onda (sine | triangle | sawtooth | square)
   * @param offset    segundos desde ahora para empezar
   * @param freqStart frecuencia inicial (Hz)
   * @param freqEnd   frecuencia final — igual que start = tono fijo
   * @param gain      ganancia pico (0–1)
   * @param dur       duración total (s)
   * @param attackRel fracción de dur que dura el attack (default 0.02)
   */
  private _tone(
    ctx:       AudioContext,
    type:      OscillatorType,
    offset:    number,
    freqStart: number,
    freqEnd:   number,
    gain:      number,
    dur:       number,
    attackRel  = 0.02,
  ): void {
    const t   = ctx.currentTime + offset
    const osc = ctx.createOscillator()
    const g   = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freqStart, t)
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur)
    }

    const attackT = t + dur * attackRel
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain,  attackT)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)

    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur + 0.01)
  }

  /**
   * Ruido percusivo filtrado — simula la "masa" de un golpe físico.
   * Úsalo junto con _tone() para sonidos con cuerpo (knock, notif).
   */
  private _thump(
    ctx:    AudioContext,
    offset: number,
    freq:   number,   // frecuencia del filtro (body del golpe)
    gain:   number,
    dur:    number,
  ): void {
    const t   = ctx.currentTime + offset
    const osc = ctx.createOscillator()
    const g   = ctx.createGain()

    // Triángulo a baja frecuencia = "thud" orgánico
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + dur)

    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)

    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur + 0.01)
  }

  // ─── Knock ("toc-toc") ────────────────────────────────────────────────────
  //
  // Diseño: dos impactos percusivos separados 140ms.
  // Cada impacto = cuerpo (thump bajo) + ataque (tono alto breve).
  // Resultado: suena a "tocar la puerta", no a sweep electrónico.

  playKnock(): void {
    try {
      const ctx = this.getCtx()

      // Impacto 1
      this._thump(ctx, 0.00, 200, 0.28, 0.09)  // cuerpo grave
      this._tone(ctx, 'sine', 0.00, 600, 300, 0.18, 0.07)  // ataque brillante

      // Impacto 2 (ligeramente más suave — eco natural)
      this._thump(ctx, 0.16, 200, 0.22, 0.09)
      this._tone(ctx, 'sine', 0.16, 560, 280, 0.14, 0.07)

    } catch { /* audio no disponible */ }
  }

  // ─── Message received ─────────────────────────────────────────────────────
  //
  // Diseño: ding doble (fundamental + quinta) — agradable, breve, notorio.
  // Referencia: sonido de mensaje Slack / iMessage.

  playMessageReceived(): void {
    try {
      const ctx = this.getCtx()
      // Fundamental (La5) + quinta (Mi6) — interval consonante
      this._tone(ctx, 'sine', 0.00, 880,  880,  0.16, 0.20)
      this._tone(ctx, 'sine', 0.00, 1320, 1320, 0.10, 0.18)
      // Eco sutil (refuerzo)
      this._tone(ctx, 'sine', 0.08, 880,  800,  0.06, 0.15)
    } catch { /* audio no disponible */ }
  }

  // ─── Incoming call — arpeggio ascendente ─────────────────────────────────
  //
  // Diseño: Do5-Mi5-Sol5 (acorde mayor en arpeggio), se repite cada 2.4s.
  // Referencia: Slack Huddle, Teams call, Discord call.
  // Gain 0.26 — claramente audible sin ser estridente.

  private _callInterval: ReturnType<typeof setInterval> | null = null

  startIncomingCall(): void {
    this.stopIncomingCall()
    try {
      const ctx = this.getCtx()

      const ring = () => {
        if (!ctx || ctx.state === 'closed') return
        // Do5 (523 Hz)
        this._tone(ctx, 'sine', 0.00, 523, 523, 0.26, 0.18)
        // Mi5 (659 Hz) — tercera mayor
        this._tone(ctx, 'sine', 0.20, 659, 659, 0.24, 0.18)
        // Sol5 (784 Hz) — quinta
        this._tone(ctx, 'sine', 0.40, 784, 784, 0.22, 0.22)
        // Pequeño eco del Do5
        this._tone(ctx, 'sine', 0.65, 523, 480, 0.10, 0.20)
      }

      ring() // inmediato
      this._callInterval = setInterval(ring, 2400)
    } catch { /* audio no disponible */ }
  }

  stopIncomingCall(): void {
    if (this._callInterval !== null) {
      clearInterval(this._callInterval)
      this._callInterval = null
    }
  }

  // ─── Call accepted (acorde mayor positivo) ────────────────────────────────

  playCallAccepted(): void {
    try {
      const ctx = this.getCtx()
      // Arpegio Do-Mi-Sol rápido y ascendente
      this._tone(ctx, 'sine', 0.00, 523, 523, 0.20, 0.12)
      this._tone(ctx, 'sine', 0.09, 659, 659, 0.18, 0.12)
      this._tone(ctx, 'sine', 0.18, 784, 784, 0.16, 0.18)
    } catch { /* audio no disponible */ }
  }

  // ─── Call declined (descenso neutral) ────────────────────────────────────

  playCallDeclined(): void {
    try {
      const ctx = this.getCtx()
      this._tone(ctx, 'sine', 0.00, 440, 330, 0.16, 0.22)
      this._tone(ctx, 'sine', 0.10, 330, 260, 0.10, 0.20)
    } catch { /* audio no disponible */ }
  }
}

/** Singleton global — importar directamente, no requiere provider */
export const soundManager = new UISoundManager()
