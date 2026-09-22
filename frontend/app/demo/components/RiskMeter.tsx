'use client'

import type { RiskLevel } from '../demoData'

interface RiskMeterProps {
  level: RiskLevel
}

const LEVELS: { id: RiskLevel; label: string }[] = [
  { id: 'low', label: 'Low risk' },
  { id: 'suspicious', label: 'Suspicious' },
  { id: 'high', label: 'High risk' },
]

function levelIndex(level: RiskLevel): number {
  return LEVELS.findIndex((l) => l.id === level)
}

export default function RiskMeter({ level }: RiskMeterProps) {
  const idx = levelIndex(level)
  const fillClass =
    level === 'high' ? 'bg-red-500' : level === 'suspicious' ? 'bg-amber-500' : 'bg-green-500'
  const percent = ((idx + 1) / LEVELS.length) * 100

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
      role="status"
      aria-label={`Current risk: ${LEVELS[idx]?.label ?? level}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-gray-900">Risk meter</h3>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
            level === 'high'
              ? 'bg-red-100 text-red-800'
              : level === 'suspicious'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-green-100 text-green-800'
          }`}
        >
          {LEVELS[idx]?.label}
        </span>
      </div>
      <div
        className="h-3 w-full rounded-full bg-gray-100 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className={`h-full ${fillClass} transition-[width] duration-500 ease-out motion-reduce:transition-none`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <ol className="mt-3 grid grid-cols-3 gap-2 text-center text-xs sm:text-sm text-gray-600">
        {LEVELS.map((item, i) => (
          <li key={item.id} className={i === idx ? 'font-semibold text-gray-900' : undefined}>
            {item.label}
          </li>
        ))}
      </ol>
    </div>
  )
}
