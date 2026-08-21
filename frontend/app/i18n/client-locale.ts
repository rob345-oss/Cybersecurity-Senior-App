import type { Locale } from '../i18n/config'
import { LOCALE_COOKIE, defaultLocale, isLocale } from '../i18n/config'
import { getDictionary } from '../i18n/get-dictionary'

/** Read locale from cookie for non-React API helpers (client-side). */
export function getClientLocale(): Locale {
  if (typeof document === 'undefined') return defaultLocale
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))
  const value = match?.[1] ? decodeURIComponent(match[1]) : null
  return isLocale(value) ? value : defaultLocale
}

export function localizedRequestFailed(): string {
  return getDictionary(getClientLocale()).common.requestFailed
}

export function localizedGoogleSignInFailed(): string {
  return getDictionary(getClientLocale()).login.googleFailed
}
