import { describe, expect, it } from 'vitest'
import { growthState, GROWTH_STATES } from '../components/shell/onboarding-growths'

describe('growthState', () => {
  it('is seed before the first step and bloom on the last step for both flows', () => {
    expect(growthState(0, 3)).toBe('seed')
    expect(growthState(0, 4)).toBe('seed')
    expect(growthState(3, 3)).toBe('bloom')
    expect(growthState(4, 4)).toBe('bloom')
  })

  it('maps the 4-step (adult) flow through every state exactly once', () => {
    expect([0, 1, 2, 3, 4].map((s) => growthState(s, 4))).toEqual(['seed', 'sprout', 'growth', 'bloom', 'bloom'])
  })

  it('maps the 3-step (under-18/unspecified) flow without breaking order', () => {
    expect([0, 1, 2, 3].map((s) => growthState(s, 3))).toEqual(['seed', 'sprout', 'bloom', 'bloom'])
  })

  it('never skips states when stepping one at a time (forward and back)', () => {
    for (const total of [3, 4]) {
      const fwd = Array.from({ length: total + 1 }, (_, s) => growthState(s, total))
      fwd.forEach((state, i) => {
        if (i === 0) return
        const prev = fwd[i - 1]
        expect(GROWTH_STATES.indexOf(state)).toBeGreaterThanOrEqual(GROWTH_STATES.indexOf(prev))
        expect(GROWTH_STATES.indexOf(state) - GROWTH_STATES.indexOf(prev)).toBeLessThanOrEqual(1)
      })
    }
  })

  it('reverses exactly when the user steps back one step', () => {
    expect(growthState(3, 4)).toBe('bloom')
    expect(growthState(2, 4)).toBe('growth')
    expect(growthState(1, 4)).toBe('sprout')
    expect(growthState(0, 4)).toBe('seed')
    expect(growthState(2, 3)).toBe('bloom')
    expect(growthState(1, 3)).toBe('sprout')
  })
})
