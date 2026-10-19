import type { Locale } from '../types'
import { parseDateKey } from '../dates'
import { ar } from './ar'
import { en, type MessageKey } from './en'

export type { MessageKey }
export type Vars = Record<string, string | number>

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, ar }
const intlLocale: Record<Locale, string> = { en: 'en-US', ar: 'ar-EG' }

export const dirFor = (l: Locale): 'ltr' | 'rtl' => (l === 'ar' ? 'rtl' : 'ltr')
/** Saturday-first weeks are common in Egypt; Monday-first for English. */
export const weekStartFor = (l: Locale) => (l === 'ar' ? 6 : 1)

const numberFormatters = new Map<string, Intl.NumberFormat>()

export function createTranslator(locale: Locale) {
  const dict = dictionaries[locale]
  const tag = intlLocale[locale]

  const fmtNum = (n: number, maxFractionDigits = 0) => {
    const key = `${tag}:${maxFractionDigits}`
    let f = numberFormatters.get(key)
    if (!f) {
      f = new Intl.NumberFormat(tag, { maximumFractionDigits: maxFractionDigits })
      numberFormatters.set(key, f)
    }
    return f.format(n)
  }

  const t = (key: MessageKey, vars?: Vars) => {
    const template = dict[key] ?? en[key] ?? key
    if (!vars) return template
    return template.replace(/\{(\w+)\}/g, (_, name: string) => {
      const v = vars[name]
      if (v === undefined) return `{${name}}`
      return typeof v === 'number' ? fmtNum(v, 1) : v
    })
  }

  const fmtDate = (key: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(tag, opts).format(parseDateKey(key))

  return { t, fmtNum, fmtDate, locale, dir: dirFor(locale), tag }
}

export type Translator = ReturnType<typeof createTranslator>
