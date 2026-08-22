import { defaultLocale, type Locale } from './config'
import { en, type Dictionary } from './dictionaries/en'
import { es } from './dictionaries/es'

const dictionaries: Record<Locale, Dictionary> = {
  en,
  es,
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale]
}

type Vars = Record<string, string | number>

export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : `{${key}}`
  )
}
