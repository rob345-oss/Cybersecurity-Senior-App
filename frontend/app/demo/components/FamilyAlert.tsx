'use client'

import { FAMILY_ALERT, SAFETY_SUMMARY } from '../demoData'

interface FamilyAlertProps {
  acknowledged: boolean
  showSummary: boolean
  onAcknowledge: () => void
  onViewSummary: () => void
  onHideSummary: () => void
  onContinue: () => void
  alertTime: string
}

export default function FamilyAlert({
  acknowledged,
  showSummary,
  onAcknowledge,
  onViewSummary,
  onHideSummary,
  onContinue,
  alertTime,
}: FamilyAlertProps) {
  return (
    <section
      className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-8 space-y-5 max-w-2xl mx-auto"
      aria-labelledby="family-alert-heading"
    >
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-2">
          CareCircle notification
        </p>
        <h2 id="family-alert-heading" className="text-2xl font-bold text-red-950 mb-3">
          {FAMILY_ALERT.title}
        </h2>
        <p className="text-red-900 leading-relaxed mb-4">{FAMILY_ALERT.body}</p>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-red-700 font-medium">Time of alert</dt>
            <dd className="text-red-950">{alertTime}</dd>
          </div>
          <div>
            <dt className="text-red-700 font-medium">Risk level</dt>
            <dd className="text-red-950 font-semibold">{FAMILY_ALERT.riskLevel}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-red-700 font-medium">Reason</dt>
            <dd className="text-red-950">{FAMILY_ALERT.reason}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onAcknowledge}
          disabled={acknowledged}
          className="min-h-[48px] px-4 py-3 rounded-lg border border-gray-300 bg-white font-semibold text-gray-900 hover:bg-gray-50 disabled:bg-green-50 disabled:border-green-300 disabled:text-green-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {acknowledged ? FAMILY_ALERT.acknowledgment : 'Simulate family acknowledgment'}
        </button>
        <button
          type="button"
          onClick={showSummary ? onHideSummary : onViewSummary}
          className="min-h-[48px] px-4 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {showSummary ? 'Hide Safety Summary' : 'View Safety Summary'}
        </button>
      </div>

      {showSummary && (
        <div
          className="rounded-xl border border-blue-200 bg-blue-50 p-5"
          aria-labelledby="safety-summary-heading"
        >
          <h3 id="safety-summary-heading" className="text-lg font-bold text-blue-950 mb-3">
            {SAFETY_SUMMARY.title}
          </h3>
          <ul className="space-y-2 list-disc pl-5 text-blue-950">
            {SAFETY_SUMMARY.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onContinue}
        className="min-h-[48px] px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Continue to dashboard
      </button>
    </section>
  )
}
