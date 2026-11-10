/**
 * Mizano's startup sound, synthesised with Web Audio so there is no asset to ship or license.
 *
 * Shape (timed against the plant growth in the opening sequence): a soft seed "drop", a slow low pad that swells with the
 * stem, three gentle bell plucks as the leaves open (A4, D5, F#5), then a short D-major add9 chord as the logo settles.
 * Everything runs through a low-pass and a quiet feedback delay and ends in a compressor, so it stays calm and never loud.
 *
 * Audio is never forced: if the platform keeps the AudioContext suspended (autoplay policy, no user gesture), `play`
 * resolves `false` and nothing is scheduled.
 */
type AudioCtor = typeof AudioContext

export interface OpeningSound {
  /** Full signature sequence (~4.5 s). Resolves `false` when the platform blocks audio. */
  play(): Promise<boolean>
  /** Just the closing chord (~1.5 s); used as feedback when the person turns sound back on. */
  chime(): Promise<boolean>
  stop(): void
  dispose(): void
}

function audioCtor(): AudioCtor | undefined {
  if (typeof window === 'undefined') return undefined
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
}

const D4 = 293.66
const A4 = 440
const D5 = 587.33
const E5 = 659.25
const FS5 = 739.99

function voice(c: AudioContext, dest: AudioNode, freq: number, at: number, dur: number, peak: number, attack: number) {
  const env = c.createGain()
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(peak, at + attack)
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  env.connect(dest)
  // Fundamental plus two quiet partials gives a soft bell rather than a bare sine.
  for (const [mult, amp] of [[1, 1], [2, 0.16], [3.01, 0.05]] as const) {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq * mult, at)
    const g = c.createGain()
    g.gain.value = amp
    osc.connect(g)
    g.connect(env)
    osc.start(at)
    osc.stop(at + dur + 0.05)
  }
}

function seedDrop(c: AudioContext, dest: AudioNode, at: number) {
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(190, at)
  osc.frequency.exponentialRampToValueAtTime(95, at + 0.16)
  const env = c.createGain()
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(0.07, at + 0.015)
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.24)
  osc.connect(env)
  env.connect(dest)
  osc.start(at)
  osc.stop(at + 0.3)
}

function chord(c: AudioContext, dest: AudioNode, at: number, dur: number) {
  for (const f of [D4, A4, E5, FS5]) voice(c, dest, f, at, dur, 0.05, 0.12)
}

export function createOpeningSound(): OpeningSound {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null

  const running = async (): Promise<AudioContext | null> => {
    const Ctor = audioCtor()
    if (!Ctor) return null
    let c: AudioContext
    try {
      c = ctx ?? new Ctor()
    } catch {
      return null
    }
    ctx = c
    if (c.state === 'suspended') {
      try {
        await Promise.race([c.resume(), new Promise<void>((resolve) => setTimeout(resolve, 300))])
      } catch {
        /* resume rejected: treated as blocked below */
      }
    }
    return (c.state as AudioContextState) === 'running' ? c : null
  }

  /** Fresh output chain per playback so stop() can silence exactly that playback. */
  const chain = (c: AudioContext): AudioNode => {
    const input = c.createGain()
    const lowpass = c.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 3200
    lowpass.Q.value = 0.4
    const out = c.createGain()
    out.gain.value = 0.6
    const delay = c.createDelay(0.5)
    delay.delayTime.value = 0.21
    const feedback = c.createGain()
    feedback.gain.value = 0.28
    const wet = c.createGain()
    wet.gain.value = 0.3
    const delayTone = c.createBiquadFilter()
    delayTone.type = 'lowpass'
    delayTone.frequency.value = 1800
    const comp = c.createDynamicsCompressor()
    input.connect(lowpass)
    lowpass.connect(out)
    lowpass.connect(delay)
    delay.connect(delayTone)
    delayTone.connect(feedback)
    feedback.connect(delay)
    delayTone.connect(wet)
    wet.connect(out)
    out.connect(comp)
    comp.connect(c.destination)
    master = out
    return input
  }

  const stop = () => {
    const c = ctx
    const m = master
    master = null
    if (!c || !m) return
    try {
      m.gain.cancelScheduledValues(c.currentTime)
      m.gain.setValueAtTime(m.gain.value, c.currentTime)
      m.gain.linearRampToValueAtTime(0, c.currentTime + 0.12)
    } catch {
      /* node already torn down */
    }
  }

  return {
    async play() {
      const c = await running()
      if (!c) return false
      stop()
      const dest = chain(c)
      const t0 = c.currentTime + 0.05
      seedDrop(c, dest, t0 + 0.2)
      voice(c, dest, 146.83, t0 + 0.3, 2.9, 0.05, 1.1)
      voice(c, dest, A4, t0 + 1.1, 1.4, 0.07, 0.012)
      voice(c, dest, D5, t0 + 1.42, 1.4, 0.065, 0.012)
      voice(c, dest, FS5, t0 + 1.78, 1.6, 0.06, 0.012)
      chord(c, dest, t0 + 2.6, 1.9)
      return true
    },
    async chime() {
      const c = await running()
      if (!c) return false
      stop()
      chord(c, chain(c), c.currentTime + 0.03, 1.4)
      return true
    },
    stop,
    dispose() {
      stop()
      const c = ctx
      ctx = null
      if (c) void c.close().catch(() => undefined)
    },
  }
}
