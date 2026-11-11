'use client'

import { useState } from 'react'
import { useStore } from '@/components/providers/app-store'
import { useAction } from '@/components/providers/use-action'
import { OnboardingLayout } from './onboarding-layout'
import { StepPanel } from './onboarding-steps'
import type { Locale, Profile, ThemePref } from '@/lib/types'

export function Onboarding() {
  const store = useStore()
  const run = useAction()
  const { t, dir } = store.i18n
  const { settings } = store
  const [step, setStep] = useState(0)
  const adult = settings.profile.ageGroup === 'adult'
  const total = adult ? 4 : 3

  const setPref = (patch: Partial<{ locale: Locale; theme: ThemePref }>) =>
    run(() => store.updateSettings((s) => ({ ...s, ...patch })))
  const setDayStart = (dayStartMinutes: number) =>
    run(() => store.updateSettings((s) => ({ ...s, dayStartMinutes })))
  const onSetProfile = (patch: Partial<Profile>) =>
    run(() => store.updateSettings((s) => ({ ...s, profile: { ...s.profile, ...patch } })))
  const finish = (profile?: Profile) =>
    run(() => store.updateSettings((s) => ({ ...s, profile: { ...(profile ?? s.profile), onboarded: true } })))

  return (
    <OnboardingLayout step={step} total={total}>
      <StepPanel
        api={{
          step,
          dir,
          settings,
          t,
          setPref,
          setDayStart,
          onSetProfile,
          setStep,
          finish,
        }}
      />
    </OnboardingLayout>
  )
}