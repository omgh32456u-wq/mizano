'use client'

import { useCallback, useState } from 'react'
import { useStore } from '@/components/providers/app-store'
import { useAction } from '@/components/providers/use-action'
import { OnboardingLayout } from './onboarding-layout'
import { StepTransition } from './onboarding-transition'
import { AuthStep } from './onboarding-auth'
import { StepPanel, type StepApi } from './onboarding-steps'
import { ProfileStep } from './onboarding-step-profile'
import { growthState } from './onboarding-growths'
import type { Locale, Profile, ThemePref } from '@/lib/types'

export function Onboarding() {
  const store = useStore()
  const run = useAction()
  const { t, dir } = store.i18n
  const { settings } = store
  const [step, setStep] = useState(0)
  const [dirMotion, setDirMotion] = useState<1 | -1>(1)
  const [introDone, setIntroDone] = useState(false)
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

  const go = useCallback(
    (n: number) => {
      setDirMotion(n >= step ? 1 : -1)
      setStep(n)
    },
    [step],
  )

  const next = useCallback(() => {
    if (adult) {
      if (step === 2) go(3)
      else if (step < 2) go(step + 1)
    } else if (step < 2) {
      go(step + 1)
    } else {
      void finish()
    }
  }, [adult, step, go, finish])

  const api: StepApi = {
    step,
    dir,
    settings,
    t,
    setPref,
    setStep: go,
    setDayStart,
    onSetProfile,
    finish,
    next,
  }

  const growth = growthState(step, total)

  return (
    <OnboardingLayout step={step} total={total} growth={growth} introDone={introDone} onIntroDone={() => setIntroDone(true)}>
      <StepTransition stepKey={step} dir={dirMotion}>
        {step === 0 && <AuthStep onSkip={() => go(1)} />}
        {step > 0 && (step === 3 && adult ? <ProfileStep api={api} /> : <StepPanel api={api} />)}
      </StepTransition>
    </OnboardingLayout>
  )
}