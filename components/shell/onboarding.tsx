'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Leaf, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Notice, Segmented } from '@/components/common/controls'
import { useStore } from '@/components/providers/app-store'
import { useAction } from '@/components/providers/use-action'
import { ProfileForm } from '@/components/settings/profile-form'
import type { AgeGroup, Locale, Profile, ThemePref, UnitSystem } from '@/lib/types'
import { cn } from '@/lib/utils'

export function Onboarding() {
  const store = useStore()
  const run = useAction()
  const { t, dir } = store.i18n
  const { settings } = store
  const [step, setStep] = useState(0)
  const adult = settings.profile.ageGroup === 'adult'
  const total = adult ? 3 : 2

  const setPref = (patch: Partial<{ locale: Locale; theme: ThemePref }>) => run(() => store.updateSettings((s) => ({ ...s, ...patch })))
  const setProfile = (patch: Partial<Profile>) => run(() => store.updateSettings((s) => ({ ...s, profile: { ...s.profile, ...patch } })))
  const finish = (profile?: Profile) =>
    run(() => store.updateSettings((s) => ({ ...s, profile: { ...(profile ?? s.profile), onboarded: true } })))

  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft
  const Next = dir === 'rtl' ? ArrowLeft : ArrowRight

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Leaf className="size-6" aria-hidden />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{t('app.name')}</span>
            <span className="text-xs text-muted-foreground">{t('onboarding.step', { n: step + 1, total })}</span>
          </div>
        </div>

        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-border')} />
          ))}
        </div>

        <section className="flex flex-col gap-6 rounded-3xl border bg-card p-6 shadow-sm">
          {step === 0 && (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-balance">{t('onboarding.welcome')}</h1>
                <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{t('onboarding.intro')}</p>
              </div>
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-medium">{t('settings.language')}</h2>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('settings.language')}>
                  {(
                    [
                      ['en', 'English', 'LTR'],
                      ['ar', 'العربية', 'RTL'],
                    ] as const
                  ).map(([value, label, hint]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={settings.locale === value}
                      lang={value}
                      onClick={() => setPref({ locale: value })}
                      className={cn(
                        'flex h-16 flex-col items-center justify-center rounded-2xl border-2 text-base font-semibold transition-colors',
                        settings.locale === value ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-muted',
                      )}
                    >
                      {label}
                      <span className="text-[10px] font-medium text-muted-foreground">{hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-medium">{t('settings.theme')}</h2>
                <Segmented
                  label={t('settings.theme')}
                  value={settings.theme}
                  onChange={(v) => setPref({ theme: v })}
                  options={(['light', 'dark', 'system'] as const).map((v) => ({ value: v, label: t(`settings.theme.${v}`) }))}
                />
              </div>
              <Button size="lg" onClick={() => setStep(1)}>
                {t('common.next')}
                <Next aria-hidden />
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{t('onboarding.about')}</h1>
                <p className="text-sm text-muted-foreground">{t('onboarding.about.hint')}</p>
              </div>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label={t('settings.ageGroup')}>
                {(['adult', 'under18', 'unspecified'] as AgeGroup[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={settings.profile.ageGroup === g}
                    onClick={() => setProfile({ ageGroup: g, ...(g !== 'adult' ? { age: null } : {}) })}
                    className={cn(
                      'flex h-13 items-center rounded-2xl border-2 px-4 text-start text-sm font-medium transition-colors',
                      settings.profile.ageGroup === g ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-muted',
                    )}
                  >
                    {t(`settings.age.${g}`)}
                  </button>
                ))}
              </div>
              {settings.profile.ageGroup === 'under18' && <Notice icon={<ShieldCheck />}>{t('onboarding.minorNote')}</Notice>}
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-medium">{t('settings.units')}</h2>
                <Segmented
                  label={t('settings.units')}
                  value={settings.profile.units}
                  onChange={(v: UnitSystem) => setProfile({ units: v })}
                  options={(['metric', 'imperial'] as const).map((v) => ({ value: v, label: t(`settings.units.${v}`) }))}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="lg" onClick={() => setStep(0)} aria-label={t('common.back')}>
                  <Back aria-hidden />
                </Button>
                <Button size="lg" className="flex-1" onClick={() => (adult ? setStep(2) : finish())}>
                  {adult ? t('common.next') : t('onboarding.finish')}
                  <Next aria-hidden />
                </Button>
              </div>
            </>
          )}

          {step === 2 && adult && (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{t('onboarding.profile')}</h1>
                <p className="text-sm text-muted-foreground">{t('onboarding.profile.hint')}</p>
              </div>
              <ProfileForm
                initial={settings.profile}
                showAgeGroup={false}
                onSubmit={(p) => finish(p)}
                submitSlot={() => (
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" size="lg" onClick={() => finish()}>
                      {t('common.skip')}
                    </Button>
                    <Button type="submit" size="lg" className="flex-1">
                      {t('onboarding.finish')}
                    </Button>
                  </div>
                )}
              />
            </>
          )}
        </section>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden />
          {t('onboarding.privacy')}
        </p>
      </div>
    </main>
  )
}
