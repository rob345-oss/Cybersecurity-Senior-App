'use client'

import { useEffect, useId, useState } from 'react'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Flag,
  PhoneOff,
  Shield,
  ShieldAlert,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { getRiskWarningCopy, formatSignalLabel } from './riskUi'
import type { RiskUiState } from './types'

export interface RiskWarningPanelProps {
  state: RiskUiState
  warningSigns?: string[]
  onContinue?: () => void
  onContinueAnyway?: () => void
  onEndCall?: () => void
  onGoBack?: () => void
  onAddTrusted?: () => void
  onAlertTrusted?: () => void
  onReport?: () => void
  /** When true, End is the hang-up action; otherwise Go back */
  inCall?: boolean
  className?: string
  /** Feedback after report/alert actions */
  actionMessage?: string | null
}

export default function RiskWarningPanel({
  state,
  warningSigns = [],
  onContinue,
  onContinueAnyway,
  onEndCall,
  onGoBack,
  onAddTrusted,
  onAlertTrusted,
  onReport,
  inCall = false,
  className,
  actionMessage,
}: RiskWarningPanelProps) {
  const titleId = useId()
  const copy = getRiskWarningCopy(state)
  const [confirmContinue, setConfirmContinue] = useState(false)
  const [showSigns, setShowSigns] = useState(false)

  useEffect(() => {
    setConfirmContinue(false)
    setShowSigns(false)
  }, [state])

  useEffect(() => {
    if (state === 'possibleRisk' || state === 'highRisk') {
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(state === 'highRisk' ? [40, 60, 40] : 30)
        }
      } catch {
        // haptics optional
      }
      try {
        if (
          typeof window !== 'undefined' &&
          localStorage.getItem('callguard_warning_sound') === 'true'
        ) {
          const ctx = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.value = state === 'highRisk' ? 440 : 520
          gain.gain.value = 0.04
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start()
          setTimeout(() => {
            osc.stop()
            ctx.close()
          }, 180)
        }
      } catch {
        // sound optional
      }
    }
  }, [state])

  if (state === 'trusted') {
    return (
      <div
        role="status"
        aria-labelledby={titleId}
        className={cn(
          'rounded-2xl border border-[var(--cg-trusted-border)] bg-[var(--cg-trusted-bg)] p-5 cg-warning-enter',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <Shield className="w-7 h-7 text-[var(--cg-trusted)] shrink-0 cg-shield-animate" aria-hidden="true" />
          <div>
            <h3 id={titleId} className="text-xl font-bold text-[var(--cg-trusted)]">
              {copy.heading}
            </h3>
            <p className="mt-1 text-lg text-[var(--cg-ink-muted)]">{copy.supporting}</p>
          </div>
        </div>
      </div>
    )
  }

  const isHigh = state === 'highRisk'
  const isPossible = state === 'possibleRisk'
  const isUnknown = state === 'unknown'

  const panelBorder = isHigh
    ? 'border-[var(--cg-high-border)] bg-[var(--cg-high-bg)]'
    : isPossible
      ? 'border-[var(--cg-possible-border)] bg-[var(--cg-possible-bg)]'
      : 'border-[var(--cg-unknown-border)] bg-[var(--cg-unknown-bg)]'

  const headingColor = isHigh
    ? 'text-[var(--cg-high)]'
    : isPossible
      ? 'text-[var(--cg-possible)]'
      : 'text-[var(--cg-unknown)]'

  const Icon = isHigh ? ShieldAlert : isPossible ? AlertTriangle : HelpCircleIcon

  return (
    <div
      role={isUnknown ? 'region' : 'alert'}
      aria-labelledby={titleId}
      aria-describedby={`${titleId}-desc`}
      className={cn(
        'rounded-2xl border-2 p-5 sm:p-6 space-y-4 shadow-lg cg-warning-enter',
        panelBorder,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn('w-8 h-8 shrink-0 cg-shield-animate', headingColor)}
          aria-hidden="true"
        />
        <div>
          <h3 id={titleId} className={cn('text-2xl font-bold', headingColor)}>
            {copy.heading}
          </h3>
          <p id={`${titleId}-desc`} className="mt-2 text-lg text-[var(--cg-ink)] leading-relaxed">
            {copy.supporting}
          </p>
          {(isPossible || isHigh) && (
            <p className="mt-2 text-base text-[var(--cg-ink-muted)]">
              Possible scam indicators detected — this is guidance to help you decide.
            </p>
          )}
        </div>
      </div>

      {copy.checklist && copy.checklist.length > 0 && (
        <ul className="space-y-2 rounded-xl bg-white/70 border border-black/5 p-4">
          {copy.checklist.map((item) => (
            <li key={item} className="flex items-start gap-2 text-lg text-[var(--cg-ink)]">
              <Check className="w-5 h-5 mt-1 text-[var(--cg-ink-muted)] shrink-0" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      )}

      {warningSigns.length > 0 && (isPossible || isHigh) && (
        <div>
          <button
            type="button"
            onClick={() => setShowSigns((v) => !v)}
            aria-expanded={showSigns}
            className="min-h-[48px] inline-flex items-center gap-2 text-lg font-semibold text-[var(--cg-ink)] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded"
          >
            View detected warning signs
            {showSigns ? (
              <ChevronUp className="w-5 h-5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
          {showSigns && (
            <ul className="mt-2 space-y-2 list-disc list-inside text-lg text-[var(--cg-ink)]">
              {warningSigns.map((sign) => (
                <li key={sign}>{formatSignalLabel(sign)}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {actionMessage && (
        <p role="status" className="text-base text-[var(--cg-ink)] bg-white/80 rounded-lg px-3 py-2">
          {actionMessage}
        </p>
      )}

      <div className="flex flex-col gap-3 pt-1">
        {isUnknown && (
          <>
            {onContinue && (
              <button
                type="button"
                onClick={onContinue}
                className="min-h-[52px] w-full rounded-xl bg-[var(--cg-call)] text-white text-lg font-semibold hover:bg-[var(--cg-call-hover)] focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300"
              >
                Continue call
              </button>
            )}
            {onAddTrusted && (
              <button
                type="button"
                onClick={onAddTrusted}
                className="min-h-[52px] w-full rounded-xl border-2 border-gray-300 bg-white text-[var(--cg-ink)] text-lg font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
              >
                <UserPlus className="w-5 h-5" aria-hidden="true" />
                Add to trusted contacts
              </button>
            )}
            {onGoBack && (
              <button
                type="button"
                onClick={onGoBack}
                className="min-h-[52px] w-full rounded-xl text-lg font-semibold text-[var(--cg-ink-muted)] hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
              >
                Go back
              </button>
            )}
          </>
        )}

        {(isPossible || isHigh) && (
          <>
            {isHigh ? (
              <>
                {(onEndCall || onGoBack) && (
                  <button
                    type="button"
                    onClick={onEndCall || onGoBack}
                    className="min-h-[56px] w-full rounded-xl bg-[var(--cg-end)] text-white text-xl font-bold inline-flex items-center justify-center gap-2 hover:bg-[var(--cg-end-hover)] focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
                  >
                    <PhoneOff className="w-6 h-6" aria-hidden="true" />
                    {inCall ? 'End call' : 'Go back'}
                  </button>
                )}
                {!confirmContinue && onContinueAnyway && (
                  <button
                    type="button"
                    onClick={() => setConfirmContinue(true)}
                    className="min-h-[44px] w-full rounded-xl text-base font-medium text-[var(--cg-ink-muted)] hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                  >
                    Continue anyway
                  </button>
                )}
                {confirmContinue && onContinueAnyway && (
                  <div className="rounded-xl border border-[var(--cg-high-border)] bg-white p-4 space-y-3">
                    <p className="text-lg text-[var(--cg-ink)]">
                      Are you sure you want to continue? We strongly recommend ending this call.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={onContinueAnyway}
                        className="min-h-[48px] flex-1 rounded-xl border border-gray-300 bg-white text-base font-semibold text-[var(--cg-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                      >
                        Yes, continue anyway
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmContinue(false)}
                        className="min-h-[48px] flex-1 rounded-xl bg-gray-900 text-white text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {onContinueAnyway && (
                  <button
                    type="button"
                    onClick={onContinueAnyway}
                    className="min-h-[52px] w-full rounded-xl border-2 border-[var(--cg-possible-border)] bg-white text-[var(--cg-possible)] text-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                  >
                    Continue anyway
                  </button>
                )}
                {(onEndCall || onGoBack) && (
                  <button
                    type="button"
                    onClick={onEndCall || onGoBack}
                    className="min-h-[56px] w-full rounded-xl bg-[var(--cg-end)] text-white text-xl font-bold inline-flex items-center justify-center gap-2 hover:bg-[var(--cg-end-hover)] focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
                  >
                    <PhoneOff className="w-6 h-6" aria-hidden="true" />
                    {inCall ? 'End call' : 'Go back'}
                  </button>
                )}
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {onAlertTrusted && (
                <button
                  type="button"
                  onClick={onAlertTrusted}
                  className="min-h-[48px] rounded-xl border border-gray-300 bg-white text-base font-semibold text-[var(--cg-ink)] inline-flex items-center justify-center gap-2 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                >
                  <Users className="w-5 h-5" aria-hidden="true" />
                  Alert a trusted person
                </button>
              )}
              {onReport && (
                <button
                  type="button"
                  onClick={onReport}
                  className="min-h-[48px] rounded-xl border border-gray-300 bg-white text-base font-semibold text-[var(--cg-ink)] inline-flex items-center justify-center gap-2 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                >
                  <Flag className="w-5 h-5" aria-hidden="true" />
                  Report the number
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function HelpCircleIcon({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center justify-center rounded-full border-2 border-current w-8 h-8 text-xl font-bold', className)} aria-hidden="true">
      ?
    </span>
  )
}

/** Dismiss control for acknowledged mid-call warnings that user chose to continue past */
export function WarningDismissButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Dismiss warning"
      className="absolute top-3 right-3 min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-full hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
    >
      <X className="w-5 h-5" aria-hidden="true" />
    </button>
  )
}
