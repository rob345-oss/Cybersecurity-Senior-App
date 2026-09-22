'use client'

import { Ban, Bell, CheckCircle2, Flag, PhoneOff } from 'lucide-react'
import { PROTECTIVE_ACTIONS, type ProtectiveActionDef } from '../demoData'
import type { ProtectiveActionId } from '../demoState'

const ICONS: Record<ProtectiveActionId, typeof PhoneOff> = {
  endCall: PhoneOff,
  blockCaller: Ban,
  notifyFamily: Bell,
  markSafe: CheckCircle2,
  reportScam: Flag,
}

interface ProtectiveActionsProps {
  results: Partial<Record<ProtectiveActionId, string>>
  showMarkSafeConfirm: boolean
  onAction: (action: ProtectiveActionDef) => void
  onConfirmMarkSafe: () => void
  onCancelMarkSafe: () => void
  onContinue: () => void
}

export default function ProtectiveActions({
  results,
  showMarkSafeConfirm,
  onAction,
  onConfirmMarkSafe,
  onCancelMarkSafe,
  onContinue,
}: ProtectiveActionsProps) {
  return (
    <section
      className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-5"
      aria-labelledby="protective-actions-heading"
    >
      <div>
        <h2 id="protective-actions-heading" className="text-xl font-bold text-gray-900 mb-1">
          Protective actions
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          These controls only update this local demo session. Nothing is sent to a real contact or
          service.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {PROTECTIVE_ACTIONS.map((action) => {
          const done = Boolean(results[action.id])
          const Icon = ICONS[action.id]
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action)}
              disabled={done && action.id !== 'markSafe'}
              className={`inline-flex items-center justify-center gap-2 min-h-[52px] px-4 py-3 rounded-xl border font-semibold text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                done
                  ? 'border-green-300 bg-green-50 text-green-900'
                  : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
              } disabled:opacity-90`}
              aria-pressed={done}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{done ? action.activeLabel : action.label}</span>
            </button>
          )
        })}
      </div>

      {Object.values(results).length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {Object.entries(results).map(([id, message]) => (
            <li key={id} className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-900">
              {message}
            </li>
          ))}
        </ul>
      )}

      {showMarkSafeConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mark-safe-title"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3"
        >
          <h3 id="mark-safe-title" className="font-semibold text-amber-950">
            Mark this call as safe?
          </h3>
          <p className="text-sm text-amber-900">
            Only mark a call as safe if you are certain it is legitimate. Lowering the risk score is
            for demonstration purposes and does not contact anyone.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onConfirmMarkSafe}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-amber-700 text-white font-medium hover:bg-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Yes, mark as safe
            </button>
            <button
              type="button"
              onClick={onCancelMarkSafe}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 font-medium hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onContinue}
        className="min-h-[48px] px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        View family alert
      </button>
    </section>
  )
}
