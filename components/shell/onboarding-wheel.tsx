'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface WheelItem {
  value: number
  label: string
  tone?: string
}

const ITEM_H = 40
const EDGE_H = 80

/**
 * Draggable vertical wheel built on native scroll plus CSS scroll-snap.
 * Touch, pen, mouse and keyboard all work with no JS measurement, which
 * keeps it smooth on low-end Android. Each row is 40px; the selected value
 * is the row snapped to the center band. EDGE_H padding lets the first and
 * last rows center under the band.
 */
export function Wheel({
  items,
  value,
  onChange,
  label,
  disabled = false,
}: {
  items: WheelItem[]
  value: number
  onChange: (v: number) => void
  label: string
  disabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const settling = useRef(false)
  const index = Math.max(0, items.findIndex((i) => i.value === value))

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const target = index * ITEM_H
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTo({ top: target })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only pool or selection changes should recenter
  }, [index])

  const handleScroll = () => {
    const el = ref.current
    if (!el || settling.current) return
    settling.current = true
    requestAnimationFrame(() => {
      settling.current = false
      const el2 = ref.current
      if (!el2) return
      const i = Math.round(el2.scrollTop / ITEM_H)
      const clamped = Math.min(Math.max(i, 0), items.length - 1)
      if (items[clamped] && items[clamped].value !== value) onChange(items[clamped].value)
    })
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={cn('relative overflow-hidden rounded-2xl border bg-muted/40', disabled && 'pointer-events-none opacity-50')}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-1/2 -z-10 h-10 -translate-y-1/2 rounded-xl border border-primary/30 bg-card shadow-soft"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-card via-card/70 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-card via-card/70 to-transparent"
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        tabIndex={disabled ? -1 : 0}
        className="scrollbar-none h-40 snap-y snap-mandatory overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:outline-ring"
        style={{ paddingTop: EDGE_H, paddingBottom: EDGE_H }}
      >
        {items.map((it, i) => (
          <div
            key={it.value}
            className={cn(
              'flex h-10 snap-center items-center justify-center text-base tabular-nums transition-transform',
              i === index ? 'scale-110 font-semibold text-foreground' : 'text-muted-foreground',
              it.tone,
            )}
          >
            {it.label}
          </div>
        ))}
      </div>
    </div>
  )
}