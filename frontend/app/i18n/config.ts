export const locales = ['en', 'es'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'
export const LOCALE_COOKIE = 'tg_locale'
export const LOCALE_STORAGE_KEY = 'tg_locale'

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'en' || value === 'es'
}

export function normalizeLocale(value: string | undefined | null): Locale {
  if (!value) return defaultLocale
  const base = value.toLowerCase().split('-')[0]
  return isLocale(base) ? base : defaultLocale
}

export function detectBrowserLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale
  const preferred = acceptLanguage
    .split(',')
    .map((part) => part.trim().split(';')[0])
    .find((lang) => normalizeLocale(lang) === 'es')
  return preferred ? 'es' : defaultLocale
}
