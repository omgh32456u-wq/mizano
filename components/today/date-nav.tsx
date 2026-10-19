'use client'

import { useRef } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/components/providers/app-store'
import { addDays, isDateKey } from '@/lib/dates'

export function DateNav() {
  const { selectedDate, setSelectedDate, today, i18n } = useStore()
  const { t, fmtDate, dir } = i18n
  const inputRef = useRef<HTMLInputElement>(null)
  const Prev = dir === 'rtl' ? ChevronRight : ChevronLeft
  const Next = dir === 'rtl' ? ChevronLeft : ChevronRight

  const relative =
    selectedDate === today
      ? t('date.today')
      : selectedDate === addDays(today, -1)
        ? t('date.yesterday')
        : selectedDate === addDays(today, 1)
          ? t('date.tomorrow')
          : fmtDate(selectedDate, { weekday: 'long' })

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
        className="flex size-11 items-center justify-center rounded-xl hover:bg-muted"
        aria-label={t('date.prev')}
      >
        <Prev className="size-5" aria-hidden />
      </button>
      <div className="relative flex min-w-0 flex-1 justify-center">
        <button
          type="button"
          onClick={() => {
            const el = inputRef.current
            if (!el) return
            if (typeof el.showPicker === 'function') {
              try {
                el.showPicker()
                return
              } catch {
                /* fall through to focus */
              }
            }
            el.focus()
          }}
          className="flex min-h-11 flex-col items-center rounded-xl px-4 py-1 hover:bg-muted"
          aria-label={`${t('date.pick')}: ${fmtDate(selectedDate, { dateStyle: 'full' })}`}
        >
          <span className="flex items-center gap-1.5 text-base font-semibold">
            <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
            {relative}
          </span>
          <span className="text-xs text-muted-foreground">{fmtDate(selectedDate, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </button>
        <input
          ref={inputRef}
          type="date"
          value={selectedDate}
          onChange={(e) => isDateKey(e.target.value) && setSelectedDate(e.target.value)}
          className="pointer-events-none absolute inset-0 opacity-0"
          tabIndex={-1}
          aria-hidden
        />
      </div>
      <button
        type="button"
        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
        className="flex size-11 items-center justify-center rounded-xl hover:bg-muted"
        aria-label={t('date.next')}
      >
        <Next className="size-5" aria-hidden />
      </button>
      {selectedDate !== today && (
        <button
          type="button"
          onClick={() => setSelectedDate(today)}
          className="ms-1 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/80"
          aria-label={t('date.goToday')}
        >
          {t('date.today')}
        </button>
      )}
    </div>
  )
}
