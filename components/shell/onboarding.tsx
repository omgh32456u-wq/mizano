'use client'

import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Monitor, Moon, ShieldCheck, Sun, Volume2, VolumeX } from 'lucide-react'
import { Notice } from '@/components/common/controls'
import { Choice } from '@/components/onboarding/choice'
import { MizanoPlant } from '@/components/onboarding/mizano-plant'
import { ProfileStep } from '@/components/onboarding/profile-step'
import { useOpening } from '@/components/onboarding/use-opening'
import { useStore } from '@/components/providers/app-store'
import { useAction } from '@/components/providers/use-action'
import { DayStartField } from '@/components/settings/day-start-field'
import { Button } from '@/components/ui/button'
import type { AgeGroup, Locale, Profile, ThemePref } from '@/lib/types'
import { cn } from '@/lib/utils'

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const
const rv = (i: number): { className: string; style: CSSProperties } => ({ className: 'ob-reveal', style: { '--i': i } as CSSProperties })

function SoundToggle({ on, onToggle, label, className }: { on: boolean; onToggle: () => void; label: string; className?: string }) {
  const Icon = on ? Volume2 : VolumeX
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      aria-label={label}
      aria-pressed={on}
      className={cn('ob-icon-btn', className)}
    >
      <Icon className="size-[18px]" aria-hidden />
    </button>
  )
}

export function Onboarding() {
  const store = useStore()
  const run = useAction()
  const { t, dir } = store.i18n
  const { settings } = store
  const [step, setStep] = useState(0)
  const [introDone, setIntroDone] = useState(false)
  const adult = settings.profile.ageGroup === 'adult'
  const total = 3

  const cardRef = useRef<HTMLElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const opening = useOpening({ card: cardRef, logo: logoRef, slot: slotRef, bg: bgRef })
  const { phase } = opening

  const setPref = (patch: Partial<{ locale: Locale; theme: ThemePref }>) => run(() => store.updateSettings((s) => ({ ...s, ...patch })))
  const setDayStart = (dayStartMinutes: number) => run(() => store.updateSettings((s) => ({ ...s, dayStartMinutes })))
  const setProfile = (patch: Partial<Profile>) => run(() => store.updateSettings((s) => ({ ...s, profile: { ...s.profile, ...patch } })))
  const finish = (profile?: Profile) =>
    run(() => store.updateSettings((s) => ({ ...s, profile: { ...(profile ?? s.profile), onboarded: true } })))
  const goTo = (n: number) => {
    setIntroDone(true)
    setStep(n)
  }

  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft
  const Next = dir === 'rtl' ? ArrowLeft : ArrowRight
  const soundLabel = t(opening.soundOn ? 'onboarding.sound.mute' : 'onboarding.sound.unmute')

  const nav = (onNext: () => void, nextLabel: string, onBack?: () => void, trailing?: ReactNode) => (
    <div className="flex gap-2 pt-1">
      {onBack && (
        <Button type="button" variant="outline" size="lg" className="w-12 shrink-0 px-0" onClick={onBack} aria-label={t('common.back')}>
          <Back aria-hidden />
        </Button>
      )}
      {trailing}
      <Button type="button" size="lg" className="min-w-0 flex-1" onClick={onNext}>
        {nextLabel}
        <Next aria-hidden />
      </Button>
    </div>
  )

  return (
    <main className="ob-root" data-phase={phase} style={{ '--ob-d': opening.playsIntro && !introDone ? '450ms' : '0ms' } as CSSProperties}>
      <div className="ob-frame">
        <header className="ob-chrome flex items-center gap-3">
          <div className="ob-brand-slot size-16 shrink-0">
            <div ref={slotRef} className="ob-brand-mark" style={{ opacity: phase === 'ready' ? 1 : 0 }}>
              <img src="/icon.svg" alt="" />
            </div>
            <MizanoPlant className="ob-header-plant" grow={1} bloom={step / 2} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-base font-semibold tracking-tight">{t('app.name')}</span>
            <span className="truncate text-xs text-muted-foreground">{t('onboarding.step', { n: step + 1, total })}</span>
          </div>
          <SoundToggle on={opening.soundOn} onToggle={opening.toggleSound} label={soundLabel} />
        </header>

        <div className="ob-chrome flex gap-1.5" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className="ob-seg" data-on={i <= step ? '1' : '0'} />
          ))}
        </div>

        <div className="ob-card-shell">
          <div className="ob-card-glow" aria-hidden />
          <section ref={cardRef} className="ob-card">
            <div key={step} className="flex min-w-0 flex-col gap-5">
              {step === 0 && (
                <>
                  <div {...rv(0)}>
                    <h1 className="text-2xl font-semibold tracking-tight text-balance">{t('onboarding.welcome')}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{t('onboarding.intro')}</p>
                  </div>
                  <div {...rv(1)} className="ob-reveal flex flex-col gap-3">
                    <h2 className="text-sm font-medium">{t('settings.language')}</h2>
                    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('settings.language')}>
                      {(
                        [
                          ['en', 'English', 'LTR'],
                          ['ar', 'العربية', 'RTL'],
                        ] as const
                      ).map(([value, label, hint]) => (
                        <Choice
                          key={value}
                          active={settings.locale === value}
                          lang={value}
                          onClick={() => setPref({ locale: value })}
                          className="h-16 flex-col gap-0 text-base font-semibold"
                        >
                          {label}
                          <span className="text-[10px] font-medium text-muted-foreground">{hint}</span>
                        </Choice>
                      ))}
                    </div>
                  </div>
                  <div {...rv(2)} className="ob-reveal flex flex-col gap-3">
                    <h2 className="text-sm font-medium">{t('settings.theme')}</h2>
                    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('settings.theme')}>
                      {(['light', 'dark', 'system'] as const).map((v) => {
                        const Icon = THEME_ICONS[v]
                        return (
                          <Choice key={v} active={settings.theme === v} onClick={() => setPref({ theme: v })} className="h-[4.5rem] flex-col gap-1.5">
                            <Icon className="size-[18px]" aria-hidden />
                            {t(`settings.theme.${v}`)}
                          </Choice>
                        )
                      })}
                    </div>
                  </div>
                  <div {...rv(3)} className="ob-reveal">
                    {nav(() => goTo(1), t('common.next'))}
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div {...rv(0)}>
                    <h1 className="text-xl font-semibold tracking-tight text-balance">{t('onboarding.about')}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{t('onboarding.about.hint')}</p>
                  </div>
                  <div {...rv(1)} className="ob-reveal flex flex-col gap-2" role="radiogroup" aria-label={t('settings.ageGroup')}>
                    {(['adult', 'under18', 'unspecified'] as AgeGroup[]).map((g) => (
                      <Choice
                        key={g}
                        active={settings.profile.ageGroup === g}
                        onClick={() => setProfile({ ageGroup: g, ...(g !== 'adult' ? { age: null } : {}) })}
                        className="justify-between px-4 text-start"
                      >
                        <span className="min-w-0 flex-1">{t(`settings.age.${g}`)}</span>
                        <span className="ob-radio-dot" aria-hidden />
                      </Choice>
                    ))}
                  </div>
                  {settings.profile.ageGroup === 'under18' && (
                    <div {...rv(2)}>
                      <Notice icon={<ShieldCheck />}>{t('onboarding.minorNote')}</Notice>
                    </div>
                  )}
                  <div {...rv(2)} className="ob-reveal flex flex-col gap-2">
                    <h2 className="text-sm font-medium">{t('onboarding.dayStart')}</h2>
                    <p className="text-xs leading-relaxed text-muted-foreground">{t('onboarding.dayStart.hint')}</p>
                    <DayStartField value={settings.dayStartMinutes} onChange={(m) => void setDayStart(m)} />
                  </div>
                  <div {...rv(3)} className="ob-reveal">
                    {nav(() => goTo(2), t('common.next'), () => goTo(0))}
                  </div>
                </>
              )}

              {step === 2 && adult && (
                <>
                  <div {...rv(0)}>
                    <h1 className="text-xl font-semibold tracking-tight text-balance">{t('onboarding.profile')}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{t('onboarding.profile.hint')}</p>
                  </div>
                  <ProfileStep
                    initial={settings.profile}
                    onSubmit={(p) => finish(p)}
                    footer={() => (
                      <div className="flex gap-2 pt-1">
                        <Button type="button" variant="outline" size="lg" className="shrink-0" onClick={() => finish()}>
                          {t('common.skip')}
                        </Button>
                        <Button type="submit" size="lg" className="min-w-0 flex-1">
                          {t('onboarding.finish')}
                        </Button>
                      </div>
                    )}
                  />
                </>
              )}

              {step === 2 && !adult && (
                <>
                  <div {...rv(0)}>
                    <h1 className="text-xl font-semibold tracking-tight text-balance">{t('onboarding.ready')}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{t('onboarding.ready.hint')}</p>
                  </div>
                  {settings.profile.ageGroup === 'under18' && (
                    <Notice icon={<ShieldCheck />}>{t('onboarding.minorNote')}</Notice>
                  )}
                  {nav(() => finish(), t('onboarding.finish'), () => goTo(1))}
                </>
              )}
            </div>
          </section>
        </div>

        <p className="ob-chrome flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0">{t('onboarding.privacy')}</span>
        </p>
      </div>

      {phase !== 'ready' && (
        <>
          <div ref={bgRef} className="ob-open-bg" data-leaving={phase === 'morph' ? '1' : '0'} onClick={opening.skip}>
            <SoundToggle on={opening.soundOn} onToggle={opening.toggleSound} label={soundLabel} className="ob-open-sound" />
            <button type="button" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm" onClick={(e) => { e.stopPropagation(); opening.skip() }}>
              {t('onboarding.opening.skip')}
            </button>
          </div>
          <MizanoPlant className="ob-open-sprout" grow={opening.growTarget} growMs={2400} />
          <div ref={logoRef} className="ob-open-logo" aria-hidden>
            <div className="ob-open-halo" />
            <div className="ob-open-logo-in">
              <div className="ob-open-brand">
                <img src="/icon.svg" alt="" />
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
