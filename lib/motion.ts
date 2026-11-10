export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** Progress of `v` through [start, end], clamped to 0..1. */
export const segment = (v: number, start: number, end: number) => clamp01((v - start) / (end - start))

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
