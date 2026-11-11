'use client'

import { useEffect, useState } from 'react'

/**
 * Growth states of the onboarding botanical illustration, in growth order.
 * The plant is one coherent SVG; these are the cumulative reveal stages of its parts.
 */
export type GrowthState = 'seed' | 'sprout' | 'growth' | 'bloom'

export const GROWTH_STATES: readonly GrowthState[] = ['seed', 'sprout', 'growth', 'bloom'] as const

/**
 * Maps onboarding progress to a growth state.
 *
 * Requirements encoded here (and tested in tests/onboarding-growth.test.ts):
 * - The last step is always `bloom`, for both 3-step and 4-step flows.
 * - State 0 (before any step) is `seed`.
 * - Moving forward advances exactly one growth state; moving back reverses it.
 * - The map is pure: step/total derive from real app state (age group), never from
 *   timers, so language/theme changes do not affect it.
 */
export function growthState(step: number, totalSteps: number): GrowthState {
  const total = Math.max(1, Math.min(totalSteps, GROWTH_STATES.length))
  if (step <= 0) return 'seed'
  if (step >= total) return 'bloom'
  // Interior steps divide the sprout..growth range evenly: 4-step flow hits every
  // state; 3-step flow skips `growth` so first and last remain seed and bloom.
  const ratio = (step / total) * (GROWTH_STATES.length - 1)
  return GROWTH_STATES[Math.round(ratio)]
}

/**
 * Matches the OS reduced-motion preference, updated live. Returns false during SSR
 * and the first client render (before the effect runs) so the server and client
 * markup agree — no hydration mismatch, and reduced-motion users simply skip
 * entrance animations on the first frame.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}