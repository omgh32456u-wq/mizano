'use client'

import Link from 'next/link'
import { AlertTriangle, Info, Target } from 'lucide-react'
import { Card, Notice } from '@/components/common/controls'
import { MACRO_KEYS, macroColor, useNutritionFormat } from '@/components/common/nutrition'
import { useStore } from '@/components/providers/app-store'
import { activeTargets, isIncomplete, KCAL_PER_GRAM, targetEligibility, type Totals } from '@/lib/nutrition'
import { cn } from '@/lib/utils'

function EnergyRing({ value, target }: { value: number; target: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  const ratio = Math.min(value / target, 1)
  const over = value > target
  return (
    <svg viewBox="0 0 120 120" className="size-28 shrink-0 -rotate-90 rtl:rotate-90 rtl:scale-x-[-1]" aria-hidden>
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - ratio)}
        className={cn('transition-[stroke-dashoffset] duration-500', over ? 'stroke-carbs' : 'stroke-energy')}
      />
    </svg>
  )
}

export function DaySummary({ totals }: { totals: Totals }) {
  const store = useStore()
  const { t } = store.i18n
  const f = useNutritionFormat()
  const targets = activeTargets(store.settings.profile, store.settings.targets)
  const eligible = targetEligibility(store.settings.profile).ok
  const kcal = totals.values.kcal
  const macroKcal = MACRO_KEYS.reduce((sum, k) => sum + totals.values[k] * KCAL_PER_GRAM[k], 0)

  return (
    <Card className="flex flex-col gap-5 p-5" aria-labelledby="summary-title">
      <h2 id="summary-title" className="sr-only">
        {t('summary.title')}
      </h2>
      <div className="flex items-center gap-5">
        {targets && (
          <div className="relative">
            <EnergyRing value={kcal} target={targets.kcal} />
            <Target className="absolute inset-0 m-auto size-5 text-muted-foreground" aria-hidden />
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t('nutrient.kcal')}</span>
          <p className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">{f.kcal(kcal)}</span>
            <span className="text-sm text-muted-foreground">
              {t('unit.kcal')} {t('summary.recorded')}
            </span>
          </p>
          {targets ? (
            <p className="text-sm text-muted-foreground tabular-nums">
              {t('summary.of', { target: `${f.kcal(targets.kcal)} ${t('unit.kcal')}` })} ·{' '}
              <span className="font-medium text-foreground">
                {kcal <= targets.kcal
                  ? t('summary.left', { n: f.kcal(targets.kcal - kcal) })
                  : t('summary.over', { n: f.kcal(kcal - targets.kcal) })}
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('summary.noTarget')}{' '}
              {eligible && (
                <Link href="/settings#targets" className="font-medium text-primary underline-offset-2 hover:underline">
                  {t('summary.setTarget')}
                </Link>
              )}
            </p>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {MACRO_KEYS.map((k) => {
          const value = totals.values[k]
          const goal = targets?.grams[k]
          const pct = goal ? Math.min((value / goal) * 100, 100) : macroKcal > 0 ? ((value * KCAL_PER_GRAM[k]) / macroKcal) * 100 : 0
          return (
            <div key={k} className="flex flex-col gap-1.5">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className={cn('size-2 rounded-full', macroColor[k])} aria-hidden />
                {t(`nutrient.${k}`)}
              </dt>
              <dd className="flex flex-col gap-1.5">
                <span className="text-lg font-semibold tabular-nums leading-none">
                  {f.grams(value)}
                  <span className="text-xs font-normal text-muted-foreground">
                    {' '}
                    {goal ? `/ ${store.i18n.fmtNum(goal)} ` : ''}
                    {t('unit.g')}
                  </span>
                </span>
                <span className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <span className={cn('block h-full rounded-full transition-[width] duration-500', macroColor[k])} style={{ width: `${pct}%` }} />
                </span>
                {totals.missing[k] > 0 && <span className="text-[11px] text-warning-foreground">{t('summary.missing', { n: totals.missing[k] })}</span>}
              </dd>
            </div>
          )
        })}
      </dl>

      {(totals.estimatedCount > 0 || isIncomplete(totals)) && (
        <div className="flex flex-col gap-2">
          {isIncomplete(totals) && <Notice tone="warning" icon={<AlertTriangle />}>{t('summary.incomplete')}</Notice>}
          {totals.estimatedCount > 0 && (
            <Notice icon={<Info />}>
              {t('summary.estimated', { n: totals.estimatedCount, total: totals.count })}
              {targets && <> {t('summary.targetIsReference')}</>}
            </Notice>
          )}
        </div>
      )}
    </Card>
  )
}
