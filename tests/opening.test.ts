import { describe, expect, it } from 'vitest'
import { clamp01, easeInOutCubic, easeOutCubic, segment } from '../lib/motion'
import {
  clipInset,
  flipBetween,
  hasSeenOpening,
  isSoundEnabled,
  markOpeningSeen,
  OPENING_SEEN_KEY,
  OPENING_SOUND_KEY,
  setSoundEnabled,
} from '../lib/opening'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => Array.from(data.keys())[i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  }
}

const throwingStorage = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
  removeItem: () => {
    throw new Error('blocked')
  },
} as unknown as Storage

describe('opening flags', () => {
  it('plays on the first launch and not again once seen', () => {
    const s = memoryStorage()
    expect(hasSeenOpening(s)).toBe(false)
    markOpeningSeen(s)
    expect(s.getItem(OPENING_SEEN_KEY)).toBe('1')
    expect(hasSeenOpening(s)).toBe(true)
  })
  it('keeps sound on by default and remembers when it was turned off', () => {
    const s = memoryStorage()
    expect(isSoundEnabled(s)).toBe(true)
    setSoundEnabled(false, s)
    expect(s.getItem(OPENING_SOUND_KEY)).toBe('off')
    expect(isSoundEnabled(s)).toBe(false)
    setSoundEnabled(true, s)
    expect(isSoundEnabled(s)).toBe(true)
    expect(s.getItem(OPENING_SOUND_KEY)).toBeNull()
  })
  it('survives unavailable storage', () => {
    expect(() => markOpeningSeen(throwingStorage)).not.toThrow()
    expect(hasSeenOpening(throwingStorage)).toBe(false)
    expect(isSoundEnabled(throwingStorage)).toBe(true)
    expect(() => setSoundEnabled(false, throwingStorage)).not.toThrow()
    expect(hasSeenOpening(null)).toBe(false)
  })
})

describe('morph geometry', () => {
  const card = { left: 16, top: 120, width: 358, height: 480 }
  const logo = { left: 139, top: 366, width: 112, height: 112 }
  it('insets the card down to the logo rectangle', () => {
    expect(clipInset(card, logo, 34)).toBe('inset(246px 123px 122px 123px round 34px)')
  })
  it('ends at a full, rounded card', () => {
    expect(clipInset(card, card, 28)).toBe('inset(0px 0px 0px 0px round 28px)')
  })
  it('never produces negative insets', () => {
    expect(clipInset(card, { left: 0, top: 0, width: 999, height: 999 }, 10)).toBe('inset(0px 0px 0px 0px round 10px)')
  })
  it('flips a centred logo onto the header slot', () => {
    const slot = { left: 16, top: 24, width: 64, height: 64 }
    const f = flipBetween(logo, slot)
    expect(f.scale).toBeCloseTo(64 / 112)
    expect(f.dx).toBe(16 + 32 - (139 + 56))
    expect(f.dy).toBe(24 + 32 - (366 + 56))
  })
})

describe('motion helpers', () => {
  it('clamps and segments progress', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(2)).toBe(1)
    expect(segment(0.5, 0.25, 0.75)).toBe(0.5)
    expect(segment(0, 0.25, 0.75)).toBe(0)
    expect(segment(1, 0.25, 0.75)).toBe(1)
  })
  it('eases from 0 to 1 monotonically', () => {
    for (const ease of [easeOutCubic, easeInOutCubic]) {
      expect(ease(0)).toBe(0)
      expect(ease(1)).toBe(1)
      let prev = 0
      for (let t = 0.1; t <= 1; t += 0.1) {
        expect(ease(t)).toBeGreaterThanOrEqual(prev)
        prev = ease(t)
      }
    }
  })
})
