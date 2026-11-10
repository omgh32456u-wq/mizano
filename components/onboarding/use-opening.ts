'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { prefersReducedMotion } from '@/lib/motion'
import {
  clipInset,
  flipBetween,
  hasSeenOpening,
  isSoundEnabled,
  markOpeningSeen,
  OPENING_TIMELINE as TL,
  setSoundEnabled,
  type Box,
} from '@/lib/opening'
import { createOpeningSound, type OpeningSound } from '@/lib/opening-sound'

export type OpeningPhase = 'logo' | 'morph' | 'ready'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
/** Corner radius of the 112px logo tile (30%) and of the finished card; the card clip animates between them. */
const LOGO_RADIUS = 34
const CARD_RADIUS = 28

const boxOf = (el: Element): Box => {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

interface Targets {
  card: RefObject<HTMLElement | null>
  /** The centred, travelling logo. */
  logo: RefObject<HTMLElement | null>
  /** Where the persistent header mark lives. */
  slot: RefObject<HTMLElement | null>
  /** Full-screen opening background. */
  bg: RefObject<HTMLElement | null>
}

/**
 * Drives the first-launch opening: logo reveal, signature sound, then the logo becoming the onboarding card.
 * Runs once per mount (state lives in refs and effects, never in render), is cancellable at any moment, and finishes
 * instantly when the app is backgrounded. Reduced motion, or an intro already seen, starts straight at `ready`.
 */
export function useOpening({ card, logo, slot, bg }: Targets) {
  const [phase, setPhase] = useState<OpeningPhase>(() => {
    if (typeof window === 'undefined') return 'ready'
    return prefersReducedMotion() || hasSeenOpening() ? 'ready' : 'logo'
  })
  const playsIntro = useRef(phase === 'logo')
  const [growTarget, setGrowTarget] = useState(phase === 'logo' ? 0 : 1)
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled())
  const soundOnRef = useRef(soundOn)
  const soundRef = useRef<OpeningSound | null>(null)
  const finishRef = useRef<() => void>(() => undefined)

  const getSound = () => (soundRef.current ??= createOpeningSound())

  useEffect(() => {
    if (!playsIntro.current) return
    const timers: number[] = []
    const anims: Animation[] = []
    let done = false
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms))
    }

    const teardown = () => {
      timers.forEach((t) => window.clearTimeout(t))
      anims.forEach((a) => a.cancel())
      document.removeEventListener('visibilitychange', onVisibility)
    }
    const finish = () => {
      if (done) return
      done = true
      teardown()
      soundRef.current?.stop()
      markOpeningSeen()
      setGrowTarget(1)
      setPhase('ready')
    }
    const onVisibility = () => {
      if (document.hidden) finish()
    }
    finishRef.current = finish
    document.addEventListener('visibilitychange', onVisibility)

    at(TL.growStart, () => setGrowTarget(1))
    // Audio only starts if the platform lets it; a blocked context resolves false and the intro stays silent.
    if (soundOnRef.current) at(150, () => void getSound().play())

    at(TL.morph, () => {
      const cardEl = card.current
      const logoEl = logo.current
      const slotEl = slot.current
      if (!cardEl || !logoEl || !slotEl || typeof cardEl.animate !== 'function') return finish()

      const cardBox = boxOf(cardEl)
      const { dx, dy, scale } = flipBetween(boxOf(logoEl), boxOf(slotEl))

      // The card opens outward from the logo's own rectangle, corners easing from tile radius to card radius.
      anims.push(
        cardEl.animate(
          [{ clipPath: clipInset(cardBox, boxOf(logoEl), LOGO_RADIUS) }, { clipPath: clipInset(cardBox, cardBox, CARD_RADIUS) }],
          { duration: TL.morphMs, easing: EASE, fill: 'both' },
        ),
      )
      // The logo holds at centre while the card opens, then travels into the header slot.
      anims.push(
        logoEl.animate(
          [
            { transform: 'translate(0px, 0px) scale(1)' },
            { transform: 'translate(0px, 0px) scale(1)', offset: 0.16, easing: 'cubic-bezier(0.65, 0, 0.2, 1)' },
            { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
          ],
          { duration: TL.travelMs, easing: 'linear', fill: 'both' },
        ),
      )
      const bgEl = bg.current
      if (bgEl) anims.push(bgEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 720, delay: 260, easing: 'ease-in-out', fill: 'both' }))

      setPhase('morph')
      at(TL.travelMs + 30, finish)
    })

    return () => {
      done = true
      teardown()
      soundRef.current?.stop()
    }
  }, [card, logo, slot, bg])

  useEffect(
    () => () => {
      soundRef.current?.dispose()
      soundRef.current = null
    },
    [],
  )

  const toggleSound = useCallback(() => {
    const next = !soundOnRef.current
    soundOnRef.current = next
    setSoundOn(next)
    setSoundEnabled(next)
    const sound = getSound()
    // Turning it on is a user gesture, so this is allowed to start audio even where autoplay was blocked.
    if (next) void sound.chime()
    else sound.stop()
  }, [])

  const skip = useCallback(() => finishRef.current(), [])

  return { phase, growTarget, soundOn, toggleSound, skip, playsIntro: playsIntro.current }
}
