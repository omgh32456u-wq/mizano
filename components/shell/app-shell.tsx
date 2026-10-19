'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { AlertTriangle, BookOpen, CalendarDays, ChartColumn, Leaf, Settings } from 'lucide-react'
import { useStore } from '@/components/providers/app-store'
import type { MessageKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Onboarding } from './onboarding'

const NAV: { href: string; label: MessageKey; icon: typeof CalendarDays }[] = [
  { href: '/', label: 'nav.today', icon: CalendarDays },
  { href: '/foods', label: 'nav.foods', icon: BookOpen },
  { href: '/progress', label: 'nav.progress', icon: ChartColumn },
  { href: '/settings', label: 'nav.settings', icon: Settings },
]

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function AppShell({ children }: { children: ReactNode }) {
  const store = useStore()
  const pathname = usePathname()
  const { t } = store.i18n

  if (store.status === 'loading') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3" role="status" aria-live="polite">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Leaf className="size-6 animate-pulse" aria-hidden />
        </div>
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    )
  }

  if (store.status === 'error' || store.status === 'blocked' || store.status === 'stale') {
    const message = store.status === 'blocked' ? 'data.blocked' : store.status === 'stale' ? 'data.versionChanged' : 'common.error'
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center" role="alert">
        <AlertTriangle className={cn('size-8', store.status === 'error' ? 'text-destructive' : 'text-warning')} aria-hidden />
        <p className="max-w-sm text-sm">{t(message)}</p>
        <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={() => window.location.reload()}>
          {t(store.status === 'error' ? 'common.retry' : 'data.reload')}
        </button>
      </div>
    )
  }

  if (!store.settings.profile.onboarded) return <Onboarding />

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-e bg-card px-4 py-6 lg:flex">
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="size-5" aria-hidden />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">{t('app.name')}</span>
            <span className="truncate text-xs text-muted-foreground">{t('onboarding.privacy')}</span>
          </div>
        </div>
        <nav aria-label={t('nav.main')} className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                  active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden />
                {t(label)}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {!store.persistent && (
          <div role="alert" className="flex items-center gap-2 bg-warning px-4 py-2 text-xs font-medium text-warning-foreground">
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            {t('data.notPersistent')}
          </div>
        )}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pt-8 lg:pb-12">
          {children}
        </main>
      </div>

      <nav
        aria-label={t('nav.main')}
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-card/85 lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className={cn('flex h-7 w-14 items-center justify-center rounded-full transition-colors', active && 'bg-accent')}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  {t(label)}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
