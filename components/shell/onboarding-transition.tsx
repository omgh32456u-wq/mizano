'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { usePrefersReducedMotion } from './onboarding-growths'

/**
 * Direction-aware single-panel crossfade/slide for step content.
 *
 * Only the inner step content animates; the shell, plant, and background stay
 * mounted and stable. When the step key changes, the previous content is kept
 * as an absolutely-positioned snapshot (zero layout shift) while the new
 * content rises in; the snapshot then unmounts. No animation library.
 *
 * - Forward: new content enters from 12px below; snapshot fades out.
 * - Backward: new content enters from 12px above.
 * - Reduced motion: instant swap, no timers, no transforms.
 * - Buttons stay responsive: nothing covers the pointer.
 */
export function StepTransition({ stepKey, dir, children }: { stepKey: string | number; dir: 1 | -1; children: ReactNode }) {
  const reduced = usePrefersReducedMotion()
  const [current, setCurrent] = useState<{ key: string | number; node: ReactNode }>({ key: stepKey, node: children })
  const [snapshot, setSnapshot] = useState<{ key: string | number; node: ReactNode } | null>(null)
  const lastKey = useRef(stepKey)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (stepKey === lastKey.current) return
    lastKey.current = stepKey
    setSnapshot(current)
    setCurrent({ key: stepKey, node: children })
    if (!reduced) {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setSnapshot(null), 280)
    } else {
      setSnapshot(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot swap must not re-run on every render
  }, [stepKey])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const enter: CSSProperties = reduced
    ? {}
    : {
        animation: `step-enter 260ms var(--ease-soft) both`,
        ['--enter-from' as keyof CSSProperties]: dir === 1 ? '12px' : '-12px',
      }

  return (
    <div className="relative">
      {snapshot && (
        <div className="pointer-events-none absolute inset-0 z-10 animate-fade-out">{snapshot.node}</div>
      )}
      <div key={current.key} style={enter}>
        {current.node}
      </div>
    </div>
  )
}