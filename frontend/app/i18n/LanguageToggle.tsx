'use client'

import { useLanguage } from './LanguageProvider'
import type { Locale } from './config'

interface LanguageToggleProps {
  /** Compact EN / ES control for tight spaces */
  compact?: boolean
  className?: string
}

export default function LanguageToggle({ compact = false, className = '' }: LanguageToggleProps) {
  const { locale, setLocale, dictionary } = useLanguage()

  const options: { value: Locale; label: string; short: string }[] = [
    { value: 'en', label: dictionary.common.english, short: 'EN' },
    { value: 'es', label: dictionary.common.spanish, short: 'ES' },
  ]

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-gray-300 p-0.5 bg-white ${className}`}
      role="group"
      aria-label={dictionary.common.language}
    >
      {options.map((option) => {
        const selected = locale === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLocale(option.value)}
            aria-pressed={selected}
            aria-label={option.label}
            className={`px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1 ${
              selected
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {compact ? option.short : option.label}
          </button>
        )
      })}
    </div>
  )
}
