import type { Locale } from './config'

export function formatCurrency(
  amount: number,
  locale: Locale,
  currency = 'USD'
): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es' : 'en-US').format(value)
}

export function formatDate(
  date: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'object' && date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat(locale === 'es' ? 'es' : 'en-US', options).format(d)
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
