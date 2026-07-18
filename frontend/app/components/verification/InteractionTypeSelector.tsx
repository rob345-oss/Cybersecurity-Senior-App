'use client'

import { INTERACTION_TYPE_OPTIONS, type InteractionType } from '../../types/verification'

interface InteractionTypeSelectorProps {
  value: InteractionType
  onChange: (value: InteractionType) => void
}

export default function InteractionTypeSelector({
  value,
  onChange,
}: InteractionTypeSelectorProps) {
  return (
    <fieldset>
      <legend className="block text-xl font-semibold text-gray-900 mb-3">
        What kind of contact was this?
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {INTERACTION_TYPE_OPTIONS.map((option) => {
          const selected = value === option.value
          return (
            <label
              key={option.value}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-4 cursor-pointer text-lg ${
                selected
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-300 bg-white hover:border-gray-500'
              }`}
            >
              <input
                type="radio"
                name="interaction_type"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="h-5 w-5"
              />
              <span className="font-medium text-gray-900">{option.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
