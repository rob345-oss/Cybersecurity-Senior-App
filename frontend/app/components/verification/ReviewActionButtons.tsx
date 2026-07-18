'use client'

import type { ReviewStatus } from '../../types/verification'

const ACTIONS: { status: ReviewStatus; label: string; className: string }[] = [
  {
    status: 'likely_safe',
    label: 'Likely Safe',
    className: 'bg-green-700 hover:bg-green-800 text-white',
  },
  {
    status: 'suspicious',
    label: 'Suspicious',
    className: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  {
    status: 'confirmed_scam',
    label: 'Confirmed Scam',
    className: 'bg-red-700 hover:bg-red-800 text-white',
  },
  {
    status: 'needs_discussion',
    label: 'Call Me Now / Needs Discussion',
    className: 'bg-gray-900 hover:bg-black text-white',
  },
]

interface ReviewActionButtonsProps {
  onSelect: (status: ReviewStatus) => void
  disabled?: boolean
  selected?: ReviewStatus | null
}

export default function ReviewActionButtons({
  onSelect,
  disabled,
  selected,
}: ReviewActionButtonsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {ACTIONS.map((action) => (
        <button
          key={action.status}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(action.status)}
          className={`rounded-xl px-4 py-4 text-lg font-semibold transition disabled:opacity-50 ${
            action.className
          } ${selected === action.status ? 'ring-4 ring-offset-2 ring-gray-900' : ''}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
