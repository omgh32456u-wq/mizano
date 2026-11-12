'use client'

import { useCallback, useState } from 'react'
import { useStore } from '@/components/providers/app-store'
import { useAction } from '@/components/providers/use-action'
import { OnboardingLayout } from './onboarding-layout'
import { StepTransition } from './onboarding-transition'
import { AuthStep } from './onboarding-auth'
import { ProfileWheelsStep } from './onboarding-profile-wheels'
import { WelcomeStep } from './onboarding-step-welcome'
import { DayStartStep } from './onboarding-step-daystart'
import { growthState } from './onboarding-growths'
import type { Locale, Profile, ThemePref } from '@/lib/types'

export const TOTAL_STEPS = 4

export function Onboarding() {
  const store = useStore()
  const run = useAction()
  const { t, dir } = store.i18n
  const { settings } = store
  const [step, setStep] = useState(0)
  const [dirMotion, setDirMotion] = useState<1 | -1>(1)
  const [introDone, setIntroDone] = useState(false)
  const total = TOTAL_STEPS

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
    if (step < 3) go(step + 1)
  }, [step, go])

  const api = { step, dir, settings, t, setPref, setStep: go, setDayStart, onSetProfile, finish, next }
  const growth = growthState(step, total)

  return (
    <OnboardingLayout step={step} total={total} growth={growth} introDone={introDone} onIntroDone={() => setIntroDone(true)}>
      <StepTransition stepKey={step} dir={dirMotion}>
        {step === 0 && <AuthStep onSkip={() => go(1)} />}
        {step === 1 && <WelcomeStep api={api} />}
        {step === 2 && <DayStartStep api={api} />}
        {step === 3 && <ProfileWheelsStep api={api} />}
      </StepTransition>
    </OnboardingLayout>
  )
}