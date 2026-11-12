'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface WheelItem {
  value: number
  label: string
  tone?: string
}

const ITEM_H = 40
const VIEWPORT_H = 160
const EDGE_H = VIEWPORT_H / 2 - ITEM_H / 2

/**
 * Draggable vertical wheel built on native scroll plus CSS scroll-snap.
 * Touch, pen, mouse and keyboard all work with no JS measurement.
 * EDGE_H padding lets the first and last rows center under the band
 * (half the viewport minus half a row).
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
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastEmitted = useRef(value)
  const index = Math.max(0, items.findIndex((i) => i.value === value))

  // Center the current value on mount and on external value changes.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const target = index * ITEM_H
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTo({ top: target })
    lastEmitted.current = value
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only pool or selection changes should recenter
  }, [index])

  // Debounced settle: only commit the selection after scrolling pauses,
  // so a fast fling never fires intermediate values.
  const handleScroll = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      const el = ref.current
      if (!el) return
      const i = Math.min(Math.max(Math.round(el.scrollTop / ITEM_H), 0), items.length - 1)
      const v = items[i]?.value
      if (v !== undefined && v !== lastEmitted.current) {
        lastEmitted.current = v
        onChange(v)
      }
    }, 110)
  }

  // Keyboard: arrows step one item; PageUp/Down jump five.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    let delta = 0
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') delta = e.key === 'ArrowDown' ? 1 : -1
    else if (e.key === 'PageDown' || e.key === 'PageUp') delta = e.key === 'PageDown' ? 5 : -5
    else return
    e.preventDefault()
    const el = ref.current
    if (!el) return
    const i = Math.min(Math.max(Math.round(el.scrollTop / ITEM_H) + delta, 0), items.length - 1)
    el.scrollTo({ top: i * ITEM_H, behavior: 'smooth' })
  }

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current)
  }, [])

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
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="listbox"
        aria-label={label}
        className="scrollbar-none h-40 snap-y snap-mandatory overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:outline-ring"
        style={{ paddingTop: EDGE_H, paddingBottom: EDGE_H }}
      >
        {items.map((it, i) => (
          <div
            key={it.value}
            role="option"
            aria-selected={i === index}
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