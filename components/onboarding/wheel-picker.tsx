'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type KeyboardEvent, type MouseEvent } from 'react'
import { prefersReducedMotion } from '@/lib/motion'
import { clampIndex, indexFromScroll, WHEEL_ITEM_HEIGHT as ITEM_H, WHEEL_VISIBLE_ROWS } from '@/lib/wheel'

const PAD = ITEM_H * Math.floor(WHEEL_VISIBLE_ROWS / 2)
/** Rows painted either side of the centre; the mask hides everything further out anyway. */
const REACH = 3

export interface WheelPickerProps {
  label: string
  unit: string
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  /** Called once, on the first real touch, key press or tap (not for programmatic positioning). */
  onInteract?: () => void
  /** False while the wheel only rests on a neutral start position and has not been chosen by the person. */
  touched: boolean
  format: (n: number) => string
}

/**
 * A vertical drum picker built on native scroll snapping, so touch scrolling, momentum and snapping are the platform's
 * own (Android WebView included). Only the cosmetic drum curvature is applied from script, and only to the few rows
 * near the centre. The scroller is a spinbutton for assistive tech and keyboards; rows are decorative.
 */
export function WheelPicker({ label, unit, min, max, value, onChange, onInteract, touched, format }: WheelPickerProps) {
  const count = max - min + 1
  const scroller = useRef<HTMLDivElement>(null)
  const rows = useRef<(HTMLDivElement | null)[]>([])
  const painted = useRef<number[]>([])
  const committed = useRef(-1)
  const suppressUntil = useRef(0)
  const interacted = useRef(false)
  const raf = useRef(0)
  const settle = useRef<number | undefined>(undefined)
  const latest = useRef({ onChange, onInteract, min })
  latest.current = { onChange, onInteract, min }

  const labels = useMemo(() => Array.from({ length: count }, (_, i) => format(min + i)), [count, min, format])

  const interact = useCallback(() => {
    if (interacted.current) return
    interacted.current = true
    latest.current.onInteract?.()
  }, [])

  const paint = useCallback((pos: number) => {
    for (const i of painted.current) {
      const el = rows.current[i]
      if (el) {
        el.style.transform = ''
        el.style.opacity = ''
        el.dataset.sel = '0'
      }
    }
    const next: number[] = []
    const from = Math.max(0, Math.floor(pos) - REACH)
    const to = Math.min(count - 1, Math.ceil(pos) + REACH)
    for (let i = from; i <= to; i++) {
      const el = rows.current[i]
      if (!el) continue
      const d = i - pos
      const ad = Math.abs(d)
      const tilt = Math.max(-70, Math.min(70, -d * 24))
      el.style.transform = `perspective(420px) rotateX(${tilt.toFixed(1)}deg) scale(${(1.12 - Math.min(ad, 3) * 0.1).toFixed(3)})`
      el.style.opacity = String(Math.max(0.08, 1 - ad * 0.34).toFixed(2))
      el.dataset.sel = ad < 0.5 ? '1' : '0'
      next.push(i)
    }
    painted.current = next
  }, [count])

  const goTo = useCallback((index: number, smooth: boolean) => {
    const el = scroller.current
    if (!el) return
    suppressUntil.current = performance.now() + 250
    el.scrollTo({ top: clampIndex(index, count) * ITEM_H, behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' })
  }, [count])

  // Rest position: set before paint, and whenever the value changes from outside (e.g. a unit change).
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const idx = clampIndex(value - min, count)
    if (idx !== committed.current) {
      suppressUntil.current = performance.now() + 250
      el.scrollTop = idx * ITEM_H
      committed.current = idx
    }
    paint(el.scrollTop / ITEM_H)
  }, [value, min, count, paint])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const commit = () => {
      window.clearTimeout(settle.current)
      const idx = indexFromScroll(el.scrollTop, ITEM_H, count)
      if (idx === committed.current) return
      committed.current = idx
      latest.current.onChange(latest.current.min + idx)
    }
    const onScroll = () => {
      if (!raf.current) {
        raf.current = requestAnimationFrame(() => {
          raf.current = 0
          paint(el.scrollTop / ITEM_H)
        })
      }
      if (performance.now() > suppressUntil.current) interact()
      window.clearTimeout(settle.current)
      settle.current = window.setTimeout(commit, 120)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('scrollend', commit)
    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('scrollend', commit)
      cancelAnimationFrame(raf.current)
      raf.current = 0
      window.clearTimeout(settle.current)
    }
  }, [count, paint, interact])

  const current = () => (scroller.current ? indexFromScroll(scroller.current.scrollTop, ITEM_H, count) : 0)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const jump: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, PageUp: -10, PageDown: 10 }
    let target: number | null = null
    if (e.key in jump) target = current() + jump[e.key]
    else if (e.key === 'Home') target = 0
    else if (e.key === 'End') target = count - 1
    if (target === null) return
    e.preventDefault()
    interact()
    goTo(target, true)
  }

  const onRowClick = (e: MouseEvent<HTMLDivElement>) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-i]')
    const i = row ? Number(row.dataset.i) : NaN
    if (Number.isNaN(i)) return
    interact()
    goTo(i, true)
  }

  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <span className="max-w-full truncate text-xs font-medium text-muted-foreground">{label}</span>
      <div className="ob-wheel" data-untouched={touched ? '0' : '1'} style={{ height: ITEM_H * WHEEL_VISIBLE_ROWS }}>
        <div className="ob-wheel-band" style={{ top: PAD, height: ITEM_H }} aria-hidden />
        <div
          ref={scroller}
          className="ob-wheel-scroll"
          role="spinbutton"
          tabIndex={0}
          aria-label={`${label} (${unit})`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${format(value)} ${unit}`}
          style={{ paddingBlock: PAD }}
          onKeyDown={onKeyDown}
          onPointerDown={interact}
          onWheel={interact}
          onClick={onRowClick}
        >
          {labels.map((text, i) => (
            <div
              key={i}
              ref={(el) => {
                rows.current[i] = el
              }}
              className="ob-wheel-item"
              data-i={i}
              style={{ height: ITEM_H }}
              aria-hidden
            >
              {text}
            </div>
          ))}
        </div>
      </div>
      <span className="ob-unit">{unit}</span>
    </div>
  )
}
