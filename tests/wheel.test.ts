import { describe, expect, it } from 'vitest'
import { defaultSettings } from '../lib/defaults'
import { CM_PER_IN } from '../lib/nutrition'
import type { Profile } from '../lib/types'
import {
  AGE_RANGE,
  ageSpec,
  applyWheelValues,
  clampIndex,
  heightFromDisplay,
  heightSpec,
  indexForValue,
  indexFromScroll,
  scrollForIndex,
  startValues,
  valueForIndex,
  weightFromDisplay,
  weightSpec,
  WHEEL_ITEM_HEIGHT,
} from '../lib/wheel'

const base: Profile = { ...defaultSettings().profile, ageGroup: 'adult' }

describe('wheel index math', () => {
  it('clamps and rounds indexes', () => {
    expect(clampIndex(-3, 10)).toBe(0)
    expect(clampIndex(99, 10)).toBe(9)
    expect(clampIndex(4.4, 10)).toBe(4)
    expect(clampIndex(4.6, 10)).toBe(5)
  })
  it('maps scroll offsets to the nearest row and back', () => {
    expect(indexFromScroll(0, WHEEL_ITEM_HEIGHT, 83)).toBe(0)
    expect(indexFromScroll(WHEEL_ITEM_HEIGHT * 12 + 7, WHEEL_ITEM_HEIGHT, 83)).toBe(12)
    expect(indexFromScroll(WHEEL_ITEM_HEIGHT * 500, WHEEL_ITEM_HEIGHT, 83)).toBe(82)
    expect(scrollForIndex(12, WHEEL_ITEM_HEIGHT)).toBe(WHEEL_ITEM_HEIGHT * 12)
  })
  it('converts between values and indexes inside a spec', () => {
    const spec = ageSpec()
    expect(indexForValue(spec, 30)).toBe(12)
    expect(valueForIndex(spec, 12)).toBe(30)
    expect(valueForIndex(spec, 9999)).toBe(AGE_RANGE.max)
    expect(indexForValue(spec, 5)).toBe(0)
  })
})

describe('wheel ranges keep the existing validation bounds', () => {
  it('uses the same age, height and weight limits as Settings', () => {
    expect(ageSpec()).toEqual({ min: 18, max: 100 })
    expect(heightSpec('metric')).toEqual({ min: 50, max: 250 })
    expect(weightSpec('metric')).toEqual({ min: 20, max: 400 })
  })
  it('narrows imperial ranges so every value converts back inside the metric bounds', () => {
    const h = heightSpec('imperial')
    const w = weightSpec('imperial')
    expect(heightFromDisplay(h.min, 'imperial')).toBeGreaterThanOrEqual(50)
    expect(heightFromDisplay(h.max, 'imperial')).toBeLessThanOrEqual(250)
    expect(weightFromDisplay(w.min, 'imperial')).toBeGreaterThanOrEqual(20)
    expect(weightFromDisplay(w.max, 'imperial')).toBeLessThanOrEqual(400)
  })
})

describe('startValues', () => {
  it('rests on stored values converted to the display unit', () => {
    const s = startValues({ ...base, age: 41, heightCm: 180, weightKg: 82, units: 'imperial' })
    expect(s.age).toBe(41)
    expect(s.height).toBe(Math.round(180 / CM_PER_IN))
    expect(s.weight).toBe(Math.round(82 / 0.45359237))
  })
  it('falls back to a resting position inside every range when nothing is stored', () => {
    for (const units of ['metric', 'imperial'] as const) {
      const s = startValues({ ...base, units })
      expect(s.age).toBeGreaterThanOrEqual(AGE_RANGE.min)
      expect(s.height).toBeGreaterThanOrEqual(heightSpec(units).min)
      expect(s.height).toBeLessThanOrEqual(heightSpec(units).max)
      expect(s.weight).toBeGreaterThanOrEqual(weightSpec(units).min)
      expect(s.weight).toBeLessThanOrEqual(weightSpec(units).max)
    }
  })
})

describe('applyWheelValues', () => {
  it('never turns an untouched wheel into data', () => {
    const p = applyWheelValues(base, { age: null, height: null, weight: null, sex: 'unspecified', activity: null })
    expect(p.age).toBeNull()
    expect(p.heightCm).toBeNull()
    expect(p.weightKg).toBeNull()
    expect(p.ageGroup).toBe('adult')
  })
  it('keeps a previously stored value when its wheel was not touched', () => {
    const p = applyWheelValues({ ...base, age: 33, heightCm: 171.5 }, { age: null, height: null, weight: 70, sex: 'female', activity: 'light' })
    expect(p.age).toBe(33)
    expect(p.heightCm).toBe(171.5)
    expect(p.weightKg).toBe(70)
    expect(p.sex).toBe('female')
    expect(p.activity).toBe('light')
  })
  it('stores metric picks as-is and converts imperial picks with 0.1 rounding', () => {
    const m = applyWheelValues(base, { age: 28, height: 165, weight: 60, sex: 'male', activity: null })
    expect([m.age, m.heightCm, m.weightKg]).toEqual([28, 165, 60])
    const i = applyWheelValues({ ...base, units: 'imperial' }, { age: 28, height: 66, weight: 150, sex: 'male', activity: null })
    expect(i.heightCm).toBe(167.6)
    expect(i.weightKg).toBe(68)
  })
  it('clamps out-of-range input instead of storing it', () => {
    const p = applyWheelValues(base, { age: 5, height: 900, weight: 1, sex: 'unspecified', activity: null })
    expect(p.age).toBe(18)
    expect(p.heightCm).toBe(250)
    expect(p.weightKg).toBe(20)
  })
  it('preserves unrelated profile fields', () => {
    const p = applyWheelValues({ ...base, trackWeight: true, onboarded: false }, { age: 40, height: null, weight: null, sex: 'unspecified', activity: null })
    expect(p.trackWeight).toBe(true)
    expect(p.onboarded).toBe(false)
  })
})
