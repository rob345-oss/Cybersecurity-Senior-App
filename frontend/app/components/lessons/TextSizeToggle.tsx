'use client'

import { useLessonTextSize, type LessonTextSize } from './LessonTextSizeProvider'

const options: { value: LessonTextSize; label: string; ariaLabel: string }[] = [
  { value: 'comfortable', label: 'A', ariaLabel: 'Comfortable text size' },
  { value: 'large', label: 'A+', ariaLabel: 'Large text size' },
  { value: 'extra-large', label: 'A++', ariaLabel: 'Extra large text size' },
]

export default function TextSizeToggle() {
  const { textSize, setTextSize } = useLessonTextSize()

  return (
    <div
      className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1"
      role="group"
      aria-label="Text size"
    >
      {options.map((option) => {
        const isActive = textSize === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTextSize(option.value)}
            aria-label={option.ariaLabel}
            aria-pressed={isActive}
            className={`min-h-12 min-w-12 rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 ${
              isActive
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            } ${option.value === 'comfortable' ? 'text-lg' : option.value === 'large' ? 'text-xl' : 'text-2xl'}`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
