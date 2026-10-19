'use client'

import { BookmarkPlus, Coffee, Moon, Plus, Sandwich, Sun } from 'lucide-react'
import { Badge, Card } from '@/components/common/controls'
import { FoodIcon } from '@/components/common/food-icon'
import { iconForLoggedItem } from '@/lib/food-icons'
import { MacroInline, useNutritionFormat } from '@/components/common/nutrition'
import { useStore } from '@/components/providers/app-store'
import { localName } from '@/lib/display'
import { sumItems } from '@/lib/nutrition'
import type { LogEntry, MealSlot } from '@/lib/types'

const ICONS: Record<MealSlot, typeof Sun> = { breakfast: Coffee, lunch: Sun, dinner: Moon, snacks: Sandwich }

export function MealSection({
  slot,
  entries,
  onAdd,
  onEdit,
  onSave,
}: {
  slot: MealSlot
  entries: LogEntry[]
  onAdd: () => void
  onEdit: (e: LogEntry) => void
  onSave: () => void
}) {
  const store = useStore()
  const { t, locale, fmtNum } = store.i18n
  const f = useNutritionFormat()
  const totals = sumItems(entries)
  const Icon = ICONS[slot]
  const name = store.mealName(slot)
  const headingId = `meal-${slot}`

  return (
    <Card aria-labelledby={headingId} className="overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground" aria-hidden>
          <Icon className="size-4.5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 id={headingId} className="truncate text-sm font-semibold">
            {name}
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            {entries.length > 0 ? `${f.kcal(totals.values.kcal)} ${t('unit.kcal')} · ${t('today.items', { n: entries.length })}` : t('meal.empty')}
          </span>
        </div>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={onSave}
            className="flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`${t('meal.saveAs')}: ${name}`}
            title={t('meal.saveAs')}
          >
            <BookmarkPlus className="size-5" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={onAdd}
          className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground hover:bg-accent/70"
          aria-label={t('today.addTo', { meal: name })}
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </div>
      {entries.length > 0 && (
        <ul className="border-t">
          {entries.map((e) => (
            <li key={e.id} className="border-b last:border-b-0">
              <button
                type="button"
                onClick={() => onEdit(e)}
                className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none"
              >
                <FoodIcon icon={iconForLoggedItem(e, store.foodsById)} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{localName(e, locale)}</span>
                    {e.estimated && (
                      <Badge tone="warning" title={t('source.estimate.hint')}>
                        ≈
                        <span className="sr-only">{t('entry.estimatedBadge')}</span>
                      </Badge>
                    )}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground tabular-nums">
                    <span>
                      {e.unitKind === 'g'
                        ? `${fmtNum(e.amount, 1)} ${t('unit.g')}`
                        : `${fmtNum(e.amount, 2)} × ${locale === 'ar' ? e.unitLabelAr : e.unitLabelEn} (${fmtNum(e.grams, 0)} ${t('unit.g')})`}
                    </span>
                    <MacroInline n={e.nutrients} />
                  </span>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {f.kcal(e.nutrients.kcal)}
                  <span className="ms-1 text-xs font-normal text-muted-foreground">{t('unit.kcal')}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
