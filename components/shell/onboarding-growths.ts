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
 * Requirements (tested in tests/onboarding-growth.test.ts):
 * - Step 0 is `seed`; the final step is always `bloom`, for both 3-step and 4-step flows.
 * - Interior steps are spaced evenly through the remaining states, so the 4-step
 *   flow hits every state and the 3-step flow skips `growth`.
 * - Pure function of (step, total): language/theme changes can never affect it.
 */
export function growthState(step: number, totalSteps: number): GrowthState {
  const total = Math.max(1, Math.min(totalSteps, GROWTH_STATES.length))
  if (step <= 0) return 'seed'
  if (step >= total) return 'bloom'
  // Interior steps: spread the (total - 1) inner positions across states 1..3
  // (sprout/growth/bloom minus the reserved bloom) evenly.
  const inner = step / total // (0, 1)
  return GROWTH_STATES[Math.min(GROWTH_STATES.length - 1, 1 + Math.round(inner * (GROWTH_STATES.length - 2)))]
}

/**
 * Matches the OS reduced-motion preference, updated live. Returns false during SSR
 * and the first client render (before the effect runs) so server and client markup
 * agree — no hydration mismatch, and reduced-motion users simply skip entrance
 * animations on the first frame.
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