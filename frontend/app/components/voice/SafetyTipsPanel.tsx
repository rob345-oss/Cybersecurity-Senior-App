'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import { cn } from '../../utils/cn'

const DEFAULT_TIPS = [
  'Never share verification codes or passwords over the phone.',
  'Never send money or gift cards because someone pressures you.',
  'Never allow someone to take remote control of your device.',
  'If you feel unsure, hang up and call a trusted family member.',
]

interface SafetyTipsPanelProps {
  tips?: string[]
  defaultOpen?: boolean
  className?: string
}

export default function SafetyTipsPanel({
  tips = DEFAULT_TIPS,
  defaultOpen = false,
  className,
}: SafetyTipsPanelProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white/90 overflow-hidden',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full min-h-[48px] flex items-center justify-between gap-3 px-4 py-3 text-left text-lg font-semibold text-[var(--cg-ink)] hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900"
      >
        <span className="inline-flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600" aria-hidden="true" />
          Safety tips
        </span>
        {open ? (
          <ChevronUp className="w-5 h-5" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-5 h-5" aria-hidden="true" />
        )}
      </button>
      {open && (
        <ul className="px-4 pb-4 space-y-3 text-lg text-[var(--cg-ink-muted)] list-disc list-inside">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
