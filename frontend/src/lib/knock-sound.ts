// lib/knock-sound.ts — Arquitectura de sonido para "Tocar puerta"
//
// Preparado para implementación futura — sin dependencias de audio por ahora.
//
// Fase siguiente: Web Audio API con 2 pulsos suaves.
// Diseño de sonido:
//   · 2 pulsos percusivos cortos (knock feel)
//   · Frecuencia: ~440Hz (A4), pitch envelope corto
//   · Gain máximo: 0.12 — sutil, nunca intrusivo
//   · Total duration: ~280ms
//
// Por qué Web Audio API (no <audio> ni Howler):
//   · Sin archivos de audio extra para distribuir
//   · Latencia mínima (< 5ms)
//   · Control total sobre pitch/gain/envelope

export function playKnockSound(): void {
  // TODO: implementar en Fase siguiente
  //
  // const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  //
  // function pulse(offsetMs: number) {
  //   const osc  = ctx.createOscillator()
  //   const gain = ctx.createGain()
  //   osc.connect(gain)
  //   gain.connect(ctx.destination)
  //
  //   const t = ctx.currentTime + offsetMs / 1000
  //   osc.frequency.setValueAtTime(440, t)
  //   osc.frequency.exponentialRampToValueAtTime(220, t + 0.08)
  //   gain.gain.setValueAtTime(0.12, t)
  //   gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10)
  //
  //   osc.start(t)
  //   osc.stop(t + 0.10)
  // }
  //
  // pulse(0)    // primer knock
  // pulse(140)  // segundo knock (eco suave)
}
