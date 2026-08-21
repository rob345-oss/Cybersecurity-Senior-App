'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  defaultLocale,
  isLocale,
  type Locale,
} from './config'
import { getDictionary, interpolate } from './get-dictionary'
import type { Dictionary } from './dictionaries/en'

type Vars = Record<string, string | number>

interface LanguageContextValue {
  locale: Locale
  dictionary: Dictionary
  setLocale: (locale: Locale) => void
  t: (getString: (dict: Dictionary) => string, vars?: Vars) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function persistLocale(locale: Locale) {
  if (typeof document !== 'undefined') {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`
    document.documentElement.lang = locale
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  }
}

function updateDocumentMeta(dictionary: Dictionary) {
  if (typeof document === 'undefined') return
  document.title = dictionary.meta.title
  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription) {
    metaDescription.setAttribute('content', dictionary.meta.description)
  } else {
    const meta = document.createElement('meta')
    meta.name = 'description'
    meta.content = dictionary.meta.description
    document.head.appendChild(meta)
  }

  const setOg = (property: string, content: string) => {
    let el = document.querySelector(`meta[property="${property}"]`)
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute('property', property)
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }
  setOg('og:title', dictionary.meta.title)
  setOg('og:description', dictionary.meta.description)
}

function updateOgLocale(locale: Locale) {
  if (typeof document === 'undefined') return
  let el = document.querySelector('meta[property="og:locale"]')
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', 'og:locale')
    document.head.appendChild(el)
  }
  el.setAttribute('content', locale === 'es' ? 'es_ES' : 'en_US')
}

interface LanguageProviderProps {
  children: ReactNode
  initialLocale: Locale
}

export function LanguageProvider({ children, initialLocale }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(
    isLocale(initialLocale) ? initialLocale : defaultLocale
  )

  const dictionary = useMemo(() => getDictionary(locale), [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    persistLocale(next)
  }, [])

  useEffect(() => {
    persistLocale(locale)
    updateDocumentMeta(dictionary)
    updateOgLocale(locale)
  }, [locale, dictionary])

  const t = useCallback(
    (getString: (dict: Dictionary) => string, vars?: Vars) => {
      try {
        const value = getString(dictionary)
        if (typeof value === 'string' && value.length > 0) {
          return interpolate(value, vars)
        }
      } catch {
        // fall through to English
      }
      try {
        return interpolate(getString(getDictionary('en')), vars)
      } catch {
        return ''
      }
    },
    [dictionary]
  )

  const value = useMemo(
    () => ({ locale, dictionary, setLocale, t }),
    [locale, dictionary, setLocale, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}

export function useTranslation() {
  const { t, dictionary, locale } = useLanguage()
  return { t, dictionary, locale }
}
