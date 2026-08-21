'use client'

import { useTranslation } from '../../i18n/LanguageProvider'
import type { Dictionary } from '../../i18n/dictionaries/en'

interface ChipGridProps {
  items: string[]
  selected: Set<string>
  onToggle: (item: string) => void
}

function signalLabel(dictionary: Dictionary, key: string): string {
  const signals = dictionary.callguard.signals as Record<string, string>
  return signals[key] ?? key.replaceAll('_', ' ')
}

export default function ChipGrid({ items, selected, onToggle }: ChipGridProps) {
  const { dictionary: d } = useTranslation()

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          type="button"
          key={item}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selected.has(item)
              ? 'bg-blue-600 text-white border border-blue-600'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => onToggle(item)}
        >
          {signalLabel(d, item)}
        </button>
      ))}
    </div>
  )
}
