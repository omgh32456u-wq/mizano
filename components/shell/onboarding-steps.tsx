'use client'

import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Notice, Segmented } from '@/components/common/controls'
import { DayStartField } from '@/components/settings/day-start-field'
import { ProfileForm } from '@/components/settings/profile-form'
import { OptionCard } from './onboarding-options'
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

/** Buttons pinned to the bottom of the panel, above safe areas. */
function StepActions({ api, showBack = true, label }: { api: StepApi; showBack?: boolean; label: string }) {
  const { t, dir, setStep } = api
  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft
  const Next = dir === 'rtl' ? ArrowLeft : ArrowRight
  return (
    <div className="mt-auto flex gap-2 pt-2">
      {showBack && (
        <Button variant="outline" size="lg" onClick={() => setStep(api.step - 1)} aria-label={t('common.back')}>
          <Back aria-hidden />
        </Button>
      )}
      <Button size="lg" className="flex-1" onClick={() => api.next()}>
        {label}
        <Next aria-hidden />
      </Button>
    </div>
  )
}

/** The four onboarding step panels. All handlers arrive via `api`; nothing persists here. */
export function StepPanel({ api }: { api: StepApi & { next: () => void } }) {
  const { t, dir, settings, step } = api
  const adult = settings.profile.ageGroup === 'adult'

  return (
    <section className="flex flex-1 flex-col gap-5 rounded-3xl border bg-card p-5 shadow-soft sm:gap-6 sm:p-7">
      {step === 0 && (
        <>
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{t('onboarding.welcome')}</h1>
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{t('onboarding.stepIntro') ?? ''}</p>
          </header>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">{t('settings.language')}</h2>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('settings.language')}>
              {(
                [
                  ['en', 'English', 'LTR'],
                  ['ar', 'العربية', 'RTL'],
                ] as const
              ).map(([value, label, hint]) => (
                <OptionCard
                  value={value}
                  checked={settings.locale === value}
                  label={label}
                  hint={hint}
                  radioLabel={t('settings.language')}
                  onChange={(v) => api.setPref({ locale: v as Locale })}
                  lang={value}
                />
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
          <StepActions api={api} showBack={false} label={t('common.next')} />
        </>
      )}

      {step === 1 && (
        <>
          <header className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{t('onboarding.about')}</h1>
            <p className="text-sm text-muted-foreground">{t('onboarding.about.hint')}</p>
          </header>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label={t('settings.ageGroup')}>
            {(['adult', 'under18', 'unspecified'] as AgeGroup[]).map((g) => (
              <OptionCard
                value={g}
                checked={settings.profile.ageGroup === g}
                label={t(`settings.age.${g}`)}
                radioLabel={t('settings.ageGroup')}
                onChange={(v) => api.onSetProfile({ ageGroup: v as AgeGroup, ...(v !== 'adult' ? { age: null } : {}) })}
              />
            ))}
          </div>
          {settings.profile.ageGroup === 'under18' && <Notice icon={<ShieldCheck />}>{t('onboarding.minorNote')}</Notice>}
          <div className="t('settings.units') && flex flex-col gap-3">
            <h2 className="text-sm font-medium">{t('settings.units')}</h2>
            <Segmented
              locale={undefined}
              label={t('settings.units')}
              value={undefined}
              onChange={(v: UnitSystem) => api.onSetProfile({ units: v })}
              options={(['metric', 'imperial'] as const).map((v) => ({ value: v, label: t(`settings.units.${v}`) }))}
            />
          </div>
          <StepActions api={api} label={t('common.next')} />
        </>
      )}

      {step === helper}
      {step === 2 && (
        <>
          <header className="flex flex-col gap-2">
            <h1 className=" SVG-icon font-semibold tracking-tight">{t('onboarding.dayStart')}</h1>
            <p className="text-sm text-muted-foreground">{t('onboarding.dayStart.hint')}</p>
          </header>
          <DayStartField value={setDayStart} onChange={(m) => void api.setDayStart(m)} />
          <StepActions api={api} label={adult ? t('common.next') : t('onboarding.finish')} />
        </>
      )}
    </section>
  )
}