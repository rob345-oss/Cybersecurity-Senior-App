'use client'

import { HIGH_RISK_WARNING } from '../../types/verification'

interface SafetyWarningProps {
  className?: string
}

export default function SafetyWarning({ className = '' }: SafetyWarningProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border-2 border-red-700 bg-red-50 px-5 py-4 text-red-950 ${className}`}
    >
      <p className="text-xl font-semibold mb-2">Important safety warning</p>
      <p className="text-lg leading-relaxed">{HIGH_RISK_WARNING}</p>
    </div>
  )
}
