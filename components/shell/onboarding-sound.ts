'use client'

/**
 * Subtle original opening tone, synthesized with Web Audio (no asset, no
 * dependency). A soft two-note rise with a gentle fade — clearly optional
 * and never played for reduced-motion users. Autoplay policy is respected:
 * the sound only starts after a user gesture (the very first tap in the
 * app), which the caller ensures by hooking a one-time pointerdown.
 */

let audioCtx: AudioContext | null = null

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    audioCtx = new AC()
  }
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

/** Gentle two-note opening chime (~1s, peak gain 0.12). No-op if audio is unavailable. */
export function playOpeningTone() {
  const ctx = ensureCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.setValueAtTime(0, now)
  master.gain.linearRampToValueAtTime(0.12, now + 0.08)
  master.gain.linearRampToValueAtTime(0, now + 1.1)
  master.connect(ctx.destination)

  const note = (freq: number, start: number, dur: number) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + start)
    g.gain.setValueAtTime(0, now + start)
    g.gain.linearRampToValueAtTime(1, now + start + 0.05)
    g.gain.exponentialRampToValueAtTime(0.001, now + start + dur)
    osc.connect(g)
    g.connect(master)
    osc.start(now + start)
    osc.stop(now + start + dur + 0.05)
  }
  // Rising major third (B4 -> E5): calm, botanical, unobtrusive.
  note(494, 0, 0.7)
  note(659, 0.22, 0.9)
}

/** True once the user has tapped/pressed anywhere in the document. */
export function armOnceOnGesture(cb: () => void): () => void {
  const handler = () => {
    window.removeEventListener('pointerdown', handler)
    cb()
  }
  window.addEventListener('pointerdown', handler, { passive: true })
  return () => window.removeEventListener('pointerdown', handler)
}