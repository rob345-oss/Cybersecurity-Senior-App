'use client'

import { Phone, PhoneOff } from 'lucide-react'
import CallerIdentity from './CallerIdentity'
import ProtectionStatus from './ProtectionStatus'
import type { CallerDisplay, RiskUiState } from './types'

interface IncomingCallModalProps {
  callerId: string
  caller?: CallerDisplay
  riskState?: RiskUiState
  onAccept: () => void
  onDecline: () => void
}

export default function IncomingCallModal({
  callerId,
  caller,
  riskState = 'unknown',
  onAccept,
  onDecline,
}: IncomingCallModalProps) {
  const display: CallerDisplay = caller || {
    phoneNumber: callerId,
    displayName: callerId || 'Unknown',
    isTrusted: false,
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Incoming call"
    >
      <div className="bg-[var(--cg-surface)] rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-6 border border-gray-200">
        <p className="text-lg font-medium text-[var(--cg-ink-muted)]">Incoming call</p>
        <CallerIdentity caller={display} />
        <div className="flex justify-center">
          <ProtectionStatus state={riskState} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={onDecline}
            className="min-h-[56px] flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--cg-end)] text-white rounded-2xl text-lg font-semibold hover:bg-[var(--cg-end-hover)] focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
          >
            <PhoneOff className="w-6 h-6" aria-hidden="true" />
            Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="min-h-[56px] flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--cg-call)] text-white rounded-2xl text-lg font-semibold hover:bg-[var(--cg-call-hover)] focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300"
          >
            <Phone className="w-6 h-6" aria-hidden="true" />
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
