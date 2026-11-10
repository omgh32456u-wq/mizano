'use client'

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Field, NativeSelect } from '@/components/common/controls'
import { useStore } from '@/components/providers/app-store'
import type { ActivityLevel, Profile, Sex } from '@/lib/types'
import { ageSpec, applyWheelValues, heightSpec, startValues, weightSpec } from '@/lib/wheel'
import { Choice } from './choice'
import { WheelPicker } from './wheel-picker'

const ACTIVITIES: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active']

/**
 * Optional adult details: age, height and weight on wheels, plus sex and activity. Wheels that stay untouched leave the
 * profile value exactly as it was (see applyWheelValues), so skipping never records a made-up number.
 */
export function ProfileStep({
  initial,
  onSubmit,
  footer,
}: {
  initial: Profile
  onSubmit: (p: Profile) => void
  footer: (submit: () => void) => ReactNode
}) {
  const { t, fmtNum } = useStore().i18n
  const units = initial.units
  const imperial = units === 'imperial'
  const specs = useMemo(() => ({ age: ageSpec(), height: heightSpec(units), weight: weightSpec(units) }), [units])
  const [vals, setVals] = useState(() => startValues(initial))
  const [touched, setTouched] = useState({ age: initial.age !== null, height: initial.heightCm !== null, weight: initial.weightKg !== null })
  const [sex, setSex] = useState<Sex>(initial.sex)
  const [activity, setActivity] = useState<ActivityLevel | null>(initial.activity)

  const touch = (k: 'age' | 'height' | 'weight') => setTouched((s) => (s[k] ? s : { ...s, [k]: true }))
  const set = (k: 'age' | 'height' | 'weight') => (v: number) => setVals((s) => (s[k] === v ? s : { ...s, [k]: v }))

  const submit = () =>
    onSubmit(
      applyWheelValues(initial, {
        age: touched.age ? vals.age : null,
        height: touched.height ? vals.height : null,
        weight: touched.weight ? vals.weight : null,
        sex,
        activity,
      }),
    )

  return (
    <form
      className="flex min-w-0 flex-col gap-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <p className="ob-reveal text-xs leading-relaxed text-muted-foreground" style={{ '--i': 0 } as CSSProperties}>
        {t('onboarding.wheel.hint')}
      </p>

      <div className="ob-reveal grid grid-cols-3 gap-2" style={{ '--i': 1 } as CSSProperties}>
        <WheelPicker
          label={t('onboarding.wheel.age')}
          unit={t('unit.years')}
          min={specs.age.min}
          max={specs.age.max}
          value={vals.age}
          touched={touched.age}
          onChange={set('age')}
          onInteract={() => touch('age')}
          format={fmtNum}
        />
        <WheelPicker
          label={t('onboarding.wheel.height')}
          unit={t(imperial ? 'unit.in' : 'unit.cm')}
          min={specs.height.min}
          max={specs.height.max}
          value={vals.height}
          touched={touched.height}
          onChange={set('height')}
          onInteract={() => touch('height')}
          format={fmtNum}
        />
        <WheelPicker
          label={t('onboarding.wheel.weight')}
          unit={t(imperial ? 'unit.lb' : 'unit.kg')}
          min={specs.weight.min}
          max={specs.weight.max}
          value={vals.weight}
          touched={touched.weight}
          onChange={set('weight')}
          onInteract={() => touch('weight')}
          format={fmtNum}
        />
      </div>

      <div className="ob-reveal flex flex-col gap-1.5" style={{ '--i': 2 } as CSSProperties}>
        <span className="text-sm font-medium">{t('settings.sex')}</span>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('settings.sex')}>
          {(['female', 'male', 'unspecified'] as const).map((s) => (
            <Choice key={s} active={sex === s} onClick={() => setSex(s)}>
              {t(`settings.sex.${s}`)}
            </Choice>
          ))}
        </div>
      </div>

      <div className="ob-reveal" style={{ '--i': 3 } as CSSProperties}>
        <Field label={t('settings.activity')}>
          {({ id }) => (
            <NativeSelect id={id} value={activity ?? ''} onChange={(e) => setActivity((e.target.value || null) as ActivityLevel | null)}>
              <option value="">{t('activity.none')}</option>
              {ACTIVITIES.map((a) => (
                <option key={a} value={a}>
                  {t(`activity.${a}`)}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
      </div>

      {footer(submit)}
    </form>
  )
}
