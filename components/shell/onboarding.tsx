'use client'

import { useState } from 'react'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  Leaf,
  Mars,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Venus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/common/controls'
import { useStore } from '@/components/providers/app-store'
import { useAction } from '@/components/providers/use-action'
import { DayStartField } from '@/components/settings/day-start-field'
import type { ActivityLevel, Locale, Profile, Sex, ThemePref } from '@/lib/types'
import { cn } from '@/lib/utils'

const ACTIVITIES: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active']
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function WheelNumber({
  label,
  value,
  min,
  max,
  unit,
  initial,
  onChange,
  tone = 'neutral',
}: {
  label: string
  value: number | null
  min: number
  max: number
  unit: string
  initial: number
  onChange: (value: number) => void
  tone?: 'neutral' | 'age'
}) {
  const base = value ?? initial
  const change = (delta: number) => onChange(clamp(base + delta, min, max))
  const ageTone = tone === 'age' && value !== null
    ? value < 18 ? 'border-amber-400/70 bg-amber-400/10 text-amber-700 dark:text-amber-300'
      : value === 18 ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : 'border-slate-200 bg-white text-slate-900'
    : 'border-border bg-card text-foreground'

  return (
    <section className="min-w-0 rounded-2xl border bg-background/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
      <div
        className="flex items-center justify-between gap-1"
        onWheel={(event) => {
          event.preventDefault()
          change(event.deltaY > 0 ? 1 : -1)
        }}
      >
        <button type="button" onClick={() => change(-1)} aria-label={`Decrease ${label}`} className="grid size-9 shrink-0 place-items-center rounded-xl border bg-card text-lg transition hover:border-primary hover:bg-accent">−</button>
        <div className={cn('flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl border-2 py-2 transition-colors duration-300', ageTone)}>
          <span className="text-[10px] opacity-55">{value === null ? ' ' : clamp(value - 1, min, max)}</span>
          <strong className="text-2xl font-bold tabular-nums leading-tight">{value ?? '—'}</strong>
          <span className="text-[10px] opacity-55">{value === null ? ' ' : clamp(value + 1, min, max)}</span>
        </div>
        <button type="button" onClick={() => change(1)} aria-label={`Increase ${label}`} className="grid size-9 shrink-0 place-items-center rounded-xl border bg-card text-lg transition hover:border-primary hover:bg-accent">+</button>
      </div>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        value={value ?? initial}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mizano-range mt-3 w-full"
      />
    </section>
  )
}

export function Onboarding() {
  const store = useStore()
  const run = useAction()
  const { t, dir } = store.i18n
  const { settings } = store
  const existing = settings.profile
  const [step, setStep] = useState(0)
  const [age, setAge] = useState<number | null>(existing.age)
  const [sex, setSex] = useState<Sex>(existing.sex)
  const [height, setHeight] = useState<number | null>(existing.heightCm)
  const [weight, setWeight] = useState<number | null>(existing.weightKg)
  const [activity, setActivity] = useState<ActivityLevel | null>(existing.activity)

  const setPref = (patch: Partial<{ locale: Locale; theme: ThemePref }>) =>
    run(() => store.updateSettings((s) => ({ ...s, ...patch })))
  const setDayStart = (dayStartMinutes: number) =>
    run(() => store.updateSettings((s) => ({ ...s, dayStartMinutes })))

  const buildProfile = (): Profile => ({
    ...existing,
    onboarded: true,
    ageGroup: age === null ? 'unspecified' : age < 18 ? 'under18' : 'adult',
    age: age !== null && age >= 18 ? age : null,
    sex,
    heightCm: height,
    weightKg: weight,
    activity,
    units: 'metric',
  })
  const finish = () => run(() => store.updateSettings((s) => ({ ...s, profile: buildProfile() })))

  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft
  const Next = dir === 'rtl' ? ArrowLeft : ArrowRight
  const minor = age !== null && age < 18

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-7">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -start-28 top-12 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -end-28 bottom-8 size-72 rounded-full bg-lime-300/10 blur-3xl" />
      </div>

      <div className="relative flex w-full max-w-xl flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="mizano-brand-mark grid size-12 place-items-center rounded-[1.15rem] bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-lg shadow-emerald-900/15">
              <Leaf className="size-6" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight">Mizano</div>
              <div className="text-xs text-muted-foreground">{t('onboarding.privacy')}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full border bg-card/75 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-emerald-500" />
            {t('onboarding.step', { n: step + 1, total: 3 })}
          </div>
        </header>

        <div className="flex gap-2" aria-label={t('onboarding.step', { n: step + 1, total: 3 })}>
          {[0, 1, 2].map((index) => (
            <span key={index} className={cn('h-1.5 flex-1 overflow-hidden rounded-full bg-border transition-all duration-500', index <= step && 'bg-emerald-500')} />
          ))}
        </div>

        <section key={step} className="mizano-onboarding-card flex flex-col gap-6 rounded-[2rem] border border-border/80 bg-card/90 p-5 shadow-2xl shadow-emerald-950/[0.06] backdrop-blur-xl sm:p-7">
          {step === 0 && (
            <>
              <div className="flex flex-col items-center gap-3 pb-1 pt-2 text-center">
                <div className="mizano-plant-stage relative grid size-28 place-items-center rounded-full bg-gradient-to-br from-emerald-50 to-lime-100 shadow-inner dark:from-emerald-950/60 dark:to-lime-950/30">
                  <span className="mizano-seed absolute bottom-7 size-3 rounded-full bg-amber-700 shadow-sm" />
                  <span className="mizano-sprout absolute bottom-7 h-10 w-10">
                    <Leaf className="mizano-leaf-left absolute -start-1 top-1 size-6 -rotate-45 text-emerald-500" />
                    <Leaf className="mizano-leaf-right absolute start-4 top-0 size-6 rotate-45 text-lime-600" />
                    <span className="mizano-stem absolute start-[18px] top-4 h-7 w-1 rounded-full bg-emerald-600" />
                  </span>
                  <span className="absolute inset-2 rounded-full border border-emerald-500/15" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">{t('onboarding.welcome')}</h1>
                  <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">{t('onboarding.intro')}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">{t('settings.language')}</span>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('settings.language')}>
                    {([['en', 'English', 'LTR'], ['ar', 'العربية', 'RTL']] as const).map(([value, label, hint]) => (
                      <button key={value} type="button" role="radio" aria-checked={settings.locale === value} lang={value}
                        onClick={() => setPref({ locale: value })}
                        className={cn('flex h-14 flex-col items-center justify-center rounded-2xl border-2 text-sm font-semibold transition-all', settings.locale === value ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-border bg-background hover:border-emerald-500/50')}>
                        {label}<span className="text-[10px] font-normal opacity-60">{hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">{t('settings.theme')}</span>
                  <Segmented label={t('settings.theme')} value={settings.theme}
                    onChange={(theme) => setPref({ theme })}
                    options={[
                      { value: 'light', label: <span className="inline-flex items-center gap-1.5"><Sun className="size-3.5" />{t('settings.theme.light')}</span> },
                      { value: 'dark', label: <span className="inline-flex items-center gap-1.5"><Moon className="size-3.5" />{t('settings.theme.dark')}</span> },
                      { value: 'system', label: <span className="inline-flex items-center gap-1.5"><Activity className="size-3.5" />{t('settings.theme.system')}</span> },
                    ]} />
                </div>
              </div>
              <Button size="lg" className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 shadow-lg shadow-emerald-700/15 hover:from-emerald-500 hover:to-green-500" onClick={() => setStep(1)}>
                {t('common.next')}<Next aria-hidden />
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-1">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="size-3.5" />{t('onboarding.profile')}
                </div>
                <h1 className="text-2xl font-bold tracking-tight">{t('onboarding.about')}</h1>
                <p className="text-sm text-muted-foreground">{t('onboarding.profile.hint')}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <WheelNumber label={t('settings.age')} value={age} min={15} max={100} initial={18} unit={settings.locale === 'ar' ? 'سنة' : 'years'} onChange={setAge} tone="age" />
                <WheelNumber label={t('settings.height', { unit: 'cm' })} value={height} min={100} max={230} initial={170} unit="cm" onChange={setHeight} />
                <WheelNumber label={t('settings.weight', { unit: 'kg' })} value={weight} min={30} max={250} initial={65} unit="kg" onChange={setWeight} />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-semibold">{t('settings.sex')}</span>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'female', label: t('settings.sex.female'), Icon: Venus, tone: 'rose' },
                    { value: 'male', label: t('settings.sex.male'), Icon: Mars, tone: 'sky' },
                    { value: 'unspecified', label: t('settings.sex.unspecified'), Icon: ShieldCheck, tone: 'slate' },
                  ] as const).map(({ value, label, Icon, tone }) => (
                    <button key={value} type="button" aria-pressed={sex === value} onClick={() => setSex(value)}
                      className={cn('flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 text-xs font-semibold transition-all', sex === value ? tone === 'rose' ? 'border-rose-400 bg-rose-400/10 text-rose-600 dark:text-rose-300' : tone === 'sky' ? 'border-sky-400 bg-sky-400/10 text-sky-600 dark:text-sky-300' : 'border-slate-400 bg-slate-400/10' : 'border-border bg-background text-muted-foreground hover:bg-muted')}>
                      <Icon className="size-5" />{label}{sex === value && <Check className="size-3" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{t('settings.activity')}</span>
                  <span className="text-[11px] text-muted-foreground">{activity ? t(`activity.${activity}`) : t('activity.none')}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {ACTIVITIES.map((value, index) => (
                    <button key={value} type="button" aria-label={t(`activity.${value}`)} aria-pressed={activity === value}
                      onClick={() => setActivity(value)}
                      className={cn('h-10 rounded-xl border transition-all', activity === value ? 'scale-[1.04] border-transparent shadow-md' : 'border-border opacity-65 hover:opacity-100')}
                      style={{ background: activity === value ? `linear-gradient(145deg, hsl(${8 + index * 31} 72% 54%), hsl(${22 + index * 27} 68% 43%))` : undefined }}>
                      <span className="mx-auto block size-2 rounded-full bg-current" />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">{t('onboarding.privacy')}</p>
              </div>

              {minor && <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-200">{t('onboarding.minorNote')}</p>}

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(0)} aria-label={t('common.back')}><Back /></Button>
                <Button type="button" size="lg" className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600" onClick={() => setStep(2)}>{t('common.next')}<Next /></Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600"><Leaf className="size-6" /></div>
                <h1 className="text-2xl font-bold tracking-tight">{t('onboarding.dayStart')}</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">{t('onboarding.dayStart.hint')}</p>
              </div>
              <DayStartField value={settings.dayStartMinutes} onChange={(minutes) => void setDayStart(minutes)} />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)} aria-label={t('common.back')}><Back /></Button>
                <Button type="button" size="lg" className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 shadow-lg shadow-emerald-700/15" onClick={finish}>{t('onboarding.finish')}<Check /></Button>
              </div>
            </>
          )}
        </section>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground"><ShieldCheck className="size-3.5" />{t('onboarding.privacy')}</p>
      </div>
    </main>
  )
}
