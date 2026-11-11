'use client'

import { useEffect, useState } from 'react'
import { BrandMark } from '@/components/common/brand-mark'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from './onboarding-growths'

/**
 * One-time brand reveal on first mount of onboarding: the real BrandMark appears
 * in a circular tile, the circle eases back, and the scrim fades out revealing
 * the environment. Runs once per Onboarding mount; reduced motion skips it.
 *
 * The app store gate in AppShell already covers real initialization, so the
 * fixed timings here never add artificial waiting.
 */
export function OnboardingIntro({ onDone }: { onDone: () => void }) {
  const reduced = usePrefersReducedMotion()
  const [phase, setPhase] = useState<'reveal' | 'settle' | 'gone'>(reduced ? 'gone' : 'reveal')

  useEffect(() => {
    if (reduced) {
      onDone()
      return
    }
    const settle = setTimeout(() => setPhase('settle'), 520)
    const done = setTimeout(() => {
      setPhase('gone')
      onDone()
    }, 900)
    return () => {
      clearTimeout(settle)
      clearTimeout(done)
    }
  }, [reduced, onDone])

  if (phase === 'gone') return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center" aria-hidden>
      <div
        className={cn(
          'absolute inset-0 bg-background transition-opacity duration-500',
          phase === 'settle' ? 'opacity-0' : 'opacity-100',
        )}
      />
      <div
        style={{
          transition: 'opacity 480ms var(--ease-soft), transform 520ms var(--ease-soft)',
          opacity: phase === 'settle' ? 0 : 1,
          transform: phase === 'settle' ? 'scale(1.18)' : 'scale(1)',
        }}
        className="relative flex size-40 items-center justify-center rounded-full border border-primary/25 bg-card shadow-lift md:size-44"
      >
        <BrandMark className="size-20 md:size-22" />
      </div>
    </div>
  )
}