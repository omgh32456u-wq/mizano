import { CM_PER_IN, kgToLb, lbToKg } from './nutrition'
import type { ActivityLevel, Profile, Sex, UnitSystem } from './types'

/** Row height (px) and number of rows shown by the onboarding wheel pickers. Shared by the component and its math. */
export const WHEEL_ITEM_HEIGHT = 36
export const WHEEL_VISIBLE_ROWS = 5

/** Validation bounds, identical to the ones ProfileForm enforces in Settings. */
export const AGE_RANGE = { min: 18, max: 100 } as const
export const HEIGHT_CM_RANGE = { min: 50, max: 250 } as const
export const WEIGHT_KG_RANGE = { min: 20, max: 400 } as const

/**
 * Where a wheel starts when the profile has no value yet. Purely a resting position: an untouched wheel never
 * writes its value into the profile (see applyWheelValues), so nothing is assumed about the person.
 */
export const WHEEL_START = { age: 30, heightCm: 170, weightKg: 70 } as const

export interface WheelSpec {
  min: number
  max: number
}

export const wheelCount = (spec: WheelSpec) => spec.max - spec.min + 1

export const clampIndex = (i: number, count: number) => Math.min(Math.max(Math.round(i), 0), Math.max(count - 1, 0))

export const indexFromScroll = (scrollTop: number, itemHeight: number, count: number) => clampIndex(scrollTop / itemHeight, count)

export const scrollForIndex = (index: number, itemHeight: number) => index * itemHeight

export const indexForValue = (spec: WheelSpec, value: number) => clampIndex(value - spec.min, wheelCount(spec))

export const valueForIndex = (spec: WheelSpec, index: number) => spec.min + clampIndex(index, wheelCount(spec))

export const ageSpec = (): WheelSpec => ({ ...AGE_RANGE })

/** Whole centimetres, or whole inches narrowed so every wheel value converts back inside the cm bounds. */
export function heightSpec(units: UnitSystem): WheelSpec {
  if (units === 'metric') return { ...HEIGHT_CM_RANGE }
  return { min: Math.ceil(HEIGHT_CM_RANGE.min / CM_PER_IN), max: Math.floor(HEIGHT_CM_RANGE.max / CM_PER_IN) }
}

/** Whole kilograms, or whole pounds narrowed so every wheel value converts back inside the kg bounds. */
export function weightSpec(units: UnitSystem): WheelSpec {
  if (units === 'metric') return { ...WEIGHT_KG_RANGE }
  return { min: Math.ceil(kgToLb(WEIGHT_KG_RANGE.min)), max: Math.floor(kgToLb(WEIGHT_KG_RANGE.max)) }
}

const round1 = (n: number) => Math.round(n * 10) / 10
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi)

export const heightToDisplay = (cm: number, units: UnitSystem) => Math.round(units === 'imperial' ? cm / CM_PER_IN : cm)
export const weightToDisplay = (kg: number, units: UnitSystem) => Math.round(units === 'imperial' ? kgToLb(kg) : kg)

export const heightFromDisplay = (v: number, units: UnitSystem) =>
  clamp(round1(units === 'imperial' ? v * CM_PER_IN : v), HEIGHT_CM_RANGE.min, HEIGHT_CM_RANGE.max)
export const weightFromDisplay = (v: number, units: UnitSystem) =>
  clamp(round1(units === 'imperial' ? lbToKg(v) : v), WEIGHT_KG_RANGE.min, WEIGHT_KG_RANGE.max)

/** Value a wheel should rest on: the stored value when there is one, otherwise the neutral start position. */
export function startValues(profile: Pick<Profile, 'age' | 'heightCm' | 'weightKg' | 'units'>) {
  const { units } = profile
  return {
    age: clamp(profile.age ?? WHEEL_START.age, AGE_RANGE.min, AGE_RANGE.max),
    height: clamp(
      heightToDisplay(profile.heightCm ?? WHEEL_START.heightCm, units),
      heightSpec(units).min,
      heightSpec(units).max,
    ),
    weight: clamp(
      weightToDisplay(profile.weightKg ?? WHEEL_START.weightKg, units),
      weightSpec(units).min,
      weightSpec(units).max,
    ),
  }
}

/**
 * Builds the adult profile from wheel results. A value is `null` while its wheel is untouched and then the stored
 * value is kept as-is, so skipping a wheel never turns a resting position into data. Output stays inside the same
 * bounds Settings validates, with the same 0.1 rounding.
 */
export function applyWheelValues(
  initial: Profile,
  v: { age: number | null; height: number | null; weight: number | null; sex: Sex; activity: ActivityLevel | null },
): Profile {
  const { units } = initial
  return {
    ...initial,
    ageGroup: 'adult',
    age: v.age === null ? initial.age : clamp(Math.round(v.age), AGE_RANGE.min, AGE_RANGE.max),
    sex: v.sex,
    heightCm: v.height === null ? initial.heightCm : heightFromDisplay(v.height, units),
    weightKg: v.weight === null ? initial.weightKg : weightFromDisplay(v.weight, units),
    activity: v.activity,
  }
}
