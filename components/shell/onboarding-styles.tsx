'use client'

import type { CSSProperties } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from './onboarding-growths'

/**
 * Transition system styles injected once. Plain CSS-in-JS string appended as a
 * <style> tag (module-scoped by unique keyframes names) because .css file writes
 * are blocked by the connector; the rules are tiny and identical to what a
 * static sheet would contain. Reduced motion is handled separately by skipping
 * the classes, so these keyframes only run when motion is allowed.
 */
export const STEP_ENTER_KEYFRAMES = `
@keyframes step-enter {
  from { opacity: 0; transform: translateY(var(--enter-from, 12px)); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes step-exit {
  from { opacity: 1; }
  to { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .step-animate { animation: none !important; }
}
`

/** Renders the shared keyframes once, near the root of the onboarding tree. */
export function OnboardingStyles() {
  return <style>{STEP_ENTER_KEYFRAMES}</style>
}

/** Panel wrapper that applies the direction-aware enter animation. */
export function StepEnter({ dir, children, className }: { dir: 1 | -1; children: ReactNode; className?: string }) {
  const reduced = usePrefersReducedMotion()
  const style: CSSProperties = reduced
    ? {}
    : {
        animation: 'step-enter 260ms var(--ease-soft) both',
        ['--enter-from' as string]: dir === 1 ? '12px' : '-12px',
      }
  return (
    <div className={cn('step-animate', className)} style={style}>
      {children}
    </div>
  )
}