'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useStore } from '@/components/providers/app-store'

/**
 * Screen-reader progress text, e.g. "Step 2 of 4" with the step name, plus a
 * compact visual dot/line indicator. `onHero` swaps the visual palette for use
 * on the deep-fern gradient panels; the text version is theme-agnostic.
 */
export function OnboardingProgress({ step, total, onHero = false }: { step: number; total: number; onHero?: boolean }) {
  const { t } = useStore().i18n
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return (
    <>
      {mounted && (
        <p className="sr-only" aria-live="polite">
          {t('onboarding.step', { n: step + 1, total })}
        </p>
      )}
      <div className={cn('flex gap-1.5', onHero && 'mb-0')} aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i < step ? 'opacity-100' : 'opacity-40',
              i < step
                ? onHero
                  ? 'bg-hero-energy'
                  : 'bg-primary'
                : onHero
                  ? 'bg-hero-track'
                  : 'bg-border',
              i === step && 'opacity-100',
              i === step && (onHero ? 'bg-hero-energy' : 'bg-primary'),
            )}
          />
        ))}
      </div>
    </>
  )
}