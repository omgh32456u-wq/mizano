'use client'

import type { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import { BrandMark } from '@/components/common/brand-mark'
import { useStore } from '@/components/providers/app-store'
import { cn } from '@/lib/utils'

export function LeafMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('pointer-events-none select-none', className)} aria-hidden>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill="currentColor" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
    </svg>
  )
}

export function StepProgress({ total, step, onHero = false }: { total: number; step: number; onHero?: boolean }) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors',
            i <= step ? (onHero ? 'bg-hero-energy' : 'bg-primary') : onHero ? 'bg-hero-track' : 'bg-border',
          )}
        />
      ))}
    </div>
  )
}

export function OnboardingLayout({ step, total, children }: { step: number; total: number; children: ReactNode }) {
  const { t } = useStore().i18n
  const stepLabel = t('onboarding.step', { n: step + 1, total })
  const backdrop = {
    backgroundImage:
      'radial-gradient(46rem 30rem at 100% 100%, color-mix(in oklch, var(--primary) 6%, transparent), transparent 70%), radial-gradient(38rem 26rem at 0% 0%, color-mix(in oklch, var(--primary) 4%, transparent), transparent 70%), radial-gradient(120rem 60rem at 50% 118%, color-mix(in oklch, var(--hero-from) 14%, transparent), transparent 72%)',
  }

  return (
    <main style={backdrop} className="relative flex min-h-dvh flex-col lg:grid lg:grid-cols-[0.95fr_1.05fr]">
      <header className="surface-hero relative flex min-h-[26dvh] shrink-0 flex-col overflow-hidden rounded-b-3xl md:min-h-[30dvh] lg:hidden">
        <LeafMotif className="absolute -end-12 -top-12 size-48 rotate-[20deg] text-hero-foreground opacity-[0.07] sm:size-60" />
        <LeafMotif className="absolute -start-14 -bottom-10 size-44 -rotate-[18deg] text-hero-foreground opacity-[0.05] sm:size-56" />
        <LeafMotif className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rotate-[12deg] text-hero-foreground opacity-[0.1] sm:size-32" />
        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-between gap-4 px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-xl sm:px-8 md:max-w-2xl">
          <div className="flex items-center gap-3">
            <BrandMark className="size-11" />
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight">{t('app.name')}</span>
              <span className="text-xs text-hero-muted">{stepLabel}</span>
            </div>
          </div>
          <StepProgress total={total} step={step} onHero />
        </div>
      </header>

      <aside className="surface-hero relative hidden min-h-dvh flex-col overflow-hidden p-10 lg:flex">
        <LeafMotif className="absolute -end-24 top-[6%] size-96 rotate-[18deg] text-hero-foreground opacity-[0.06] xl:size-[30rem]" />
        <LeafMotif className="absolute -start-28 bottom-[4%] size-[26rem] -rotate-[16deg] text-hero-foreground opacity-[0.05] xl:size-[32rem]" />
        <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col xl:max-w-md">
          <div className="flex items-center gap-3">
            <BrandMark className="size-12" />
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight">{t('app.name')}</span>
              <span className="text-xs text-hero-muted">{stepLabel}</span>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center py-10">
            <LeafMotif className="relative size-52 rotate-[14deg] text-hero-foreground opacity-[0.12] xl:size-64" />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-hero-muted">
            <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
            {t('onboarding.privacy')}
          </p>
        </div>
      </aside>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-xl sm:px-6 md:pt-7 lg:max-w-lg lg:justify-center lg:px-8 lg:pb-10 lg:pt-10">
        <div className="hidden flex-col gap-3 lg:flex">
          <span className="text-sm font-medium text-muted-foreground">{stepLabel}</span>
          <StepProgress total={total} step={step} />
        </div>
        {children}
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground lg:hidden">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
          {t('onboarding.privacy')}
        </p>
      </div>
    </main>
  )
}