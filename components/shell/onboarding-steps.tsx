'use client'

import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Notice, Segmented } from '@/components/common/controls'
import { DayStartField } from '@/components/settings/day-start-field'
import { ProfileForm } from '@/components/settings/profile-form'
import type { Translator } from '@/lib/i18n'
import type { AgeGroup, Locale, Profile, Settings, ThemePref, UnitSystem } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface StepApi {
  step: number
  dir: 'ltr' | 'rtl'
  settings: Settings
  t: Translator['t']
  setPref: (patch: Partial<{ locale: Locale; theme: ThemePref }>) => void
  setDayStart: (dayStartMinutes: number) => void
  onSetProfile: (patch: Partial<Profile>) => void
  setStep: (n: number) => void
  finish: (profile?: Profile) => void
}

/** The four onboarding step panels. All handlers arrive via `api`; nothing persists here. */
export function StepPanel({ api }: { api: StepApi }) {
  const { t, dir, settings, step, setStep } = api
  const adult = settings.profile.ageGroup === 'adult'
  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft
  const Next = dir === 'rtl' ? ArrowLeft : ArrowRight

  return (
    <section className="mt-4 flex flex-1 flex-col gap-5 rounded-3xl border bg-card p-6 shadow-soft sm:gap-6 sm:p-7 lg:mt-6 lg:flex-none">
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
                  onClick={() => api.setPref({ locale: value })}
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
              onChange={(v) => api.setPref({ theme: v })}
              options={(['light', 'dark', 'system'] as const).map((v) => ({ value: v, label: t(`settings.theme.${v}`) }))}
            />
          </div>
          <div className="mt-auto flex gap-2">
            <Button size="lg" className="flex-1" onClick={() => setStep(1)}>
              {t('common.next')}
              <Next aria-hidden />
            </Button>
          </div>
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
                onClick={() => api.onSetProfile({ ageGroup: g, ...(g !== 'adult' ? { age: null } : {}) })}
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
              onChange={(v: UnitSystem) => api.onSetProfile({ units: v })}
              options={(['metric', 'imperial'] as const).map((v) => ({ value: v, label: t(`settings.units.${v}`) }))}
            />
          </div>
          <div className="mt-auto flex gap-2">
            <Button variant="outline" size="lg" onClick={() => setStep(0)} aria-label={t('common.back')}>
              <Back aria-hidden />
            </Button>
            <Button size="lg" className="flex-1" onClick={() => setStep(2)}>
              {t('common.next')}
              <Next aria-hidden />
            </Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{t('onboarding.dayStart')}</h1>
            <p className="text-sm text-muted-foreground">{t('onboarding.dayStart.hint')}</p>
          </div>
          <DayStartField value={settings.dayStartMinutes} onChange={(m) => void api.setDayStart(m)} />
          <div className="mt-auto flex gap-2">
            <Button variant="outline" size="lg" onClick={() => setStep(1)} aria-label={t('common.back')}>
              <Back aria-hidden />
            </Button>
            <Button size="lg" className="flex-1" onClick={() => (adult ? setStep(3) : api.finish())}>
              {adult ? t('common.next') : t('onboarding.finish')}
              <Next aria-hidden />
            </Button>
          </div>
        </>
      )}

      {step === 3 && adult && (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{t('onboarding.profile')}</h1>
            <p className="text-sm text-muted-foreground">{t('onboarding.profile.hint')}</p>
          </div>
          <ProfileForm
            initial={settings.profile}
            showAgeGroup={false}
            className="flex-1"
            onSubmit={(p) => api.finish(p)}
            submitSlot={() => (
              <div className="mt-auto flex gap-2">
                <Button type="button" variant="outline" size="lg" onClick={() => api.finish()}>
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
  )
}