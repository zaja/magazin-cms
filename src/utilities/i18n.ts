import hrTranslations from '@/translations/hr.json'
import enTranslations from '@/translations/en.json'

type TranslationKey = string
type NestedTranslations = {
  [key: string]: string | NestedTranslations
}

const translations: Record<string, NestedTranslations> = {
  hr: hrTranslations as NestedTranslations,
  en: enTranslations as NestedTranslations,
}

const defaultLocale = 'en'

function getNestedValue(obj: NestedTranslations, path: string): string | undefined {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return undefined
    }
  }

  return typeof current === 'string' ? current : undefined
}

export function t(
  key: TranslationKey,
  locale: string = defaultLocale,
  variables?: Record<string, string | number>,
): string {
  const localeTranslations = translations[locale] || translations[defaultLocale]

  let value = getNestedValue(localeTranslations, key)

  if (!value) {
    value = getNestedValue(translations[defaultLocale], key)
  }

  if (!value) {
    console.warn(`Translation missing for key: ${key}`)
    return key
  }

  if (variables) {
    return interpolate(value, variables)
  }

  return value
}

export function interpolate(template: string, variables: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key]?.toString() ?? match
  })
}

export function pluralize(
  count: number,
  forms: { one: string; few: string; many: string },
  locale: string = defaultLocale,
): string {
  if (locale === 'hr') {
    if (count === 1) return forms.one
    if (count >= 2 && count <= 4) return forms.few
    return forms.many
  }

  return count === 1 ? forms.one : forms.many
}

export function formatDate(
  date: Date | string,
  locale: string = defaultLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  return d.toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-US', options || defaultOptions)
}

export function formatDateTime(date: Date | string, locale: string = defaultLocale): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleString(locale === 'hr' ? 'hr-HR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: Date | string, locale: string = defaultLocale): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (locale === 'hr') {
    if (diffSec < 60) return 'upravo sada'
    if (diffMin < 60)
      return `prije ${diffMin} ${pluralize(diffMin, { one: 'minutu', few: 'minute', many: 'minuta' }, 'hr')}`
    if (diffHour < 24)
      return `prije ${diffHour} ${pluralize(diffHour, { one: 'sat', few: 'sata', many: 'sati' }, 'hr')}`
    if (diffDay < 7)
      return `prije ${diffDay} ${pluralize(diffDay, { one: 'dan', few: 'dana', many: 'dana' }, 'hr')}`
    return formatDate(d, locale)
  }

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`
  if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`
  return formatDate(d, locale)
}

export function formatNumber(num: number, locale: string = defaultLocale): string {
  return num.toLocaleString(locale === 'hr' ? 'hr-HR' : 'en-US')
}

export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = defaultLocale,
): string {
  return new Intl.NumberFormat(locale === 'hr' ? 'hr-HR' : 'en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export const i18n = {
  t,
  interpolate,
  pluralize,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatCurrency,
  defaultLocale,
  supportedLocales: ['en', 'hr'],
}

export default i18n
