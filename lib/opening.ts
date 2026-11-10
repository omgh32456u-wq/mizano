/** Persisted flags for the first-launch opening sequence. Kept outside the settings model on purpose. */
export const OPENING_SEEN_KEY = 'tmm:opening-seen'
export const OPENING_SOUND_KEY = 'tmm:opening-sound'

/** Milliseconds from mount. The plant grows from `growStart`, the card morph starts at `morph`. */
export const OPENING_TIMELINE = { growStart: 250, growMs: 2400, morph: 3000, morphMs: 950, travelMs: 1150 } as const

export interface Box {
  left: number
  top: number
  width: number
  height: number
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function hasSeenOpening(store: Storage | null = storage()): boolean {
  try {
    return store?.getItem(OPENING_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

export function markOpeningSeen(store: Storage | null = storage()): void {
  try {
    store?.setItem(OPENING_SEEN_KEY, '1')
  } catch {
    /* storage unavailable: the intro may replay next launch, which is harmless */
  }
}

/** Sound is on unless the person turned it off. */
export function isSoundEnabled(store: Storage | null = storage()): boolean {
  try {
    return store?.getItem(OPENING_SOUND_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSoundEnabled(on: boolean, store: Storage | null = storage()): void {
  try {
    if (on) store?.removeItem(OPENING_SOUND_KEY)
    else store?.setItem(OPENING_SOUND_KEY, 'off')
  } catch {
    /* preference simply does not persist */
  }
}

/** clip-path inset() that crops `outer` down to `inner` (both in the same coordinate space), with rounded corners. */
export function clipInset(outer: Box, inner: Box, radius: number): string {
  const top = Math.max(0, inner.top - outer.top)
  const left = Math.max(0, inner.left - outer.left)
  const right = Math.max(0, outer.left + outer.width - (inner.left + inner.width))
  const bottom = Math.max(0, outer.top + outer.height - (inner.top + inner.height))
  return `inset(${top}px ${right}px ${bottom}px ${left}px round ${radius}px)`
}

/** Translate + uniform scale that carries a box (scaled around its centre) onto another box. */
export function flipBetween(from: Box, to: Box): { dx: number; dy: number; scale: number } {
  return {
    dx: to.left + to.width / 2 - (from.left + from.width / 2),
    dy: to.top + to.height / 2 - (from.top + from.height / 2),
    scale: from.width > 0 ? to.width / from.width : 1,
  }
}
