import { describe, expect, it } from 'vitest'
import { growthState } from '../components/shell/onboarding-growths'

describe('growthState', () => {
  it('maps the 4-step (adult) flow through seed, sprout, growth, bloom', () => {
    expect([0, 1, 2, 3, 4].map((s) => growthState(s, 4))).toEqual(['seed', 'sprout', 'growth', 'bloom', 'bloom'])
  })

  it('maps the 3-step (under-18/unspecified) flow, skipping growth', () => {
    expect([0, 1, 2, 3].map((s) => growthState(s, 3))).toEqual(['seed', 'sprout', 'bloom', 'bloom'])
  })

  it('is seed before the first step and bloom at the last interactive step for both flows', () => {
    expect(growthState(0, 3)).toBe('seed')
    expect(growthState(0, 4)).toBe('seed')
    expect(growthState(2, 3)).toBe('bloom')
    expect(growthState(3, 4)).toBe('bloom')
    expect(growthState(3, 3)).toBe('bloom')
    expect(growthState(4, 4)).toBe('bloom')
  })

  it('never goes backwards and advances at most one state per step', () => {
    for (const total of [3, 4]) {
      const seq = Array.from({ length: total + 1 }, (_, s) => growthState(s, total))
      seq.forEach((state, i) => {
        if (i === 0) return
        const d = ['seed', 'sprout', 'growth', 'bloom'].indexOf(state)
        const dPrev = ['seed', 'sprout', 'growth', 'bloom'].indexOf(seq[i - 1])
        expect(d - dPrev).toBeGreaterThanOrEqual(0)
        expect(d - dPrev).toBeLessThanOrEqual(1)
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
    expect(growthState(0, 3)).toBe('seed')
  })
})