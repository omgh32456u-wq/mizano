'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from './onboarding-growths'

/**
 * A direction-aware, single-panel crossfade/slide transition for step content.
 *
 * Design: only the inner step content animates; the shell, plant, and background
 * stay mounted and stable. The panel is keyed by step index so React swaps the
 * content node, and CSS handles the enter/exit. Instead of the brittle React
 * two-panel "AnimatePresence" pattern, we keep the previous snapshot mounted
 * absolutely while the new content enters — this gives a true crossfade with
 * zero layout shift, without any animation library.
 *
 * - Forward: new content slides 12px up + fades in; old fades out quickly.
 * - Backward: new content slides 12px down + fades in.
 * - Reduced motion: instant swap, no timers, no transforms.
 * - Buttons stay responsive: no overlay, no pointer-events blocking.
 */
export function StepTransition({ stepKey, dir, children }: { stepKey: string | number; dir: 1 | -1; children: ReactNode }) {
  const reduced = usePrefersReducedMotion()
  const [current, setCurrent] = useState<{ key: string | number; node: ReactNode }>({ key: stepKey, node: children })
  const [snapshot, setSnapshot] = useState<{ key: string | number; node: ReactNode } | null>(null)
  const lastKey = useRef(stepKey)

  // When the key changes, snapshot the old content and take in the new one.
  useEffect(() => {
    if (stepKey !== lastKey.current) {
      lastKey.current = stepKey
      setSnapshot(current)
      setCurrent({ key: stepKey, node: children })
      if (!reduced) {
        const clear = setTimeout(() => setSnapshot(null), 260)
        return () => clearTimeout(clear)
      }
      setSnapshot(null)
    }
  }, [stepKey, children, current, reduced])

  return (
    <div className="relative">
      {snapshot && (
        <div
          key={`snap-${snapshot.key}`}
          className="absolute inset-0 z-10 opacity-0"
          style={{ transition: 'opacity 120ms ease-out' }}
        >
          {snapshot.node}
        </div>
    )}
      <div
        key={current.key}
        className={cn(
          'transition-all',
          reduced ? 'duration-0' : 'duration-200 ease-out',
        )}
        style={
          reduced
            ? undefined
            : {
                animation: 'rise 240ms var(--ease-soft) both',
                [dir === 1 ? 'animationDirection' : 'animationDirection']: 'normal',
              }
        }
      >
        {current.node}
      </div>
    </div>
  )
}