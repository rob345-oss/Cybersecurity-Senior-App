'use client'

import type { VerificationRiskLevel } from '../../types/verification'
import SafetyWarning from './SafetyWarning'

const LEVEL_STYLES: Record<VerificationRiskLevel, string> = {
  low: 'bg-green-50 text-green-900 border-green-300',
  medium: 'bg-amber-50 text-amber-950 border-amber-400',
  high: 'bg-orange-50 text-orange-950 border-orange-500',
  critical: 'bg-red-50 text-red-950 border-red-600',
}

interface RiskSummaryProps {
  riskScore?: number | null
  riskLevel?: VerificationRiskLevel | null
  riskReasons?: string[]
  showWarning?: boolean
}

export default function RiskSummary({
  riskScore,
  riskLevel,
  riskReasons = [],
  showWarning,
}: RiskSummaryProps) {
  if (riskScore == null || !riskLevel) {
    return (
      <p className="text-lg text-gray-700">Risk score will appear after you submit.</p>
    )
  }

  const shouldWarn = showWarning ?? (riskLevel === 'high' || riskLevel === 'critical')

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border-2 px-5 py-4 ${LEVEL_STYLES[riskLevel]}`}>
        <p className="text-sm font-medium uppercase tracking-wide mb-1">Risk check</p>
        <p className="text-3xl font-bold capitalize">
          {riskLevel} · {riskScore}/100
        </p>
        <p className="text-base mt-2">
          This is a warning based on common scam signs. A trusted contact still needs to
          confirm what is going on.
        </p>
      </div>

      {riskReasons.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Why we flagged this</h3>
          <ul className="space-y-2">
            {riskReasons.map((reason) => (
              <li
                key={reason}
                className="text-lg text-gray-800 pl-4 border-l-4 border-gray-300"
              >
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {shouldWarn && <SafetyWarning />}
    </div>
  )
}
