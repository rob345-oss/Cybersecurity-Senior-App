'use client'

import { Phone, PhoneOff, Captions } from 'lucide-react'
import { CALL_SCENARIO, SCREENING_STEPS } from '../demoData'
import type { DemoStage } from '../demoState'
import CallTranscript from './CallTranscript'
import RiskMeter from './RiskMeter'
import DemoProgress from './DemoProgress'
import { TRANSCRIPT_LINES, WARNING_SIGNALS, type RiskLevel } from '../demoData'

interface SimulatedCallProps {
  stage: DemoStage
  showTranscript: boolean
  screeningStepIndex: number
  transcriptIndex: number
  riskLevel: RiskLevel
  onAnswer: () => void
  onDecline: () => void
  onToggleTranscript: () => void
  onContinueToProtective?: () => void
}

export default function SimulatedCall({
  stage,
  showTranscript,
  screeningStepIndex,
  transcriptIndex,
  riskLevel,
  onAnswer,
  onDecline,
  onToggleTranscript,
  onContinueToProtective,
}: SimulatedCallProps) {
  const isIncoming = stage === 'incoming'
  const showHighAlert = stage === 'highRisk' || stage === 'protective'

  return (
    <div className="space-y-6">
      <DemoProgress
        steps={['Incoming call', 'Screening', 'Risk analysis', 'Protective actions']}
        currentIndex={
          stage === 'incoming'
            ? 0
            : stage === 'screening'
              ? 1
              : stage === 'suspicious' || stage === 'highRisk'
                ? 2
                : 3
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <section
          className="rounded-2xl border border-gray-200 bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-lg"
          aria-labelledby="incoming-call-heading"
        >
          <p className="text-sm text-slate-300 mb-2">Titanium Call Screen</p>
          <h2 id="incoming-call-heading" className="text-2xl sm:text-3xl font-bold mb-1">
            {CALL_SCENARIO.callerName}
          </h2>
          <p className="text-slate-300 mb-4">{CALL_SCENARIO.callerNumber}</p>
          <p className="inline-flex items-center rounded-lg bg-blue-500/20 border border-blue-400/40 px-3 py-2 text-sm text-blue-100 mb-8">
            {CALL_SCENARIO.screeningLabel}
          </p>

          {isIncoming ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onAnswer}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] flex-1 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white font-semibold"
              >
                <Phone className="w-5 h-5" aria-hidden="true" />
                Answer
              </button>
              <button
                type="button"
                onClick={onDecline}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white font-semibold"
              >
                <PhoneOff className="w-5 h-5" aria-hidden="true" />
                Decline
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-200" role="status">
                {stage === 'screening'
                  ? SCREENING_STEPS[Math.max(0, screeningStepIndex)]?.label ?? 'Analyzing…'
                  : 'Call in progress — CallGuard is assisting'}
              </p>
              {stage === 'screening' && (
                <ol className="space-y-2" aria-label="Screening steps">
                  {SCREENING_STEPS.map((step, index) => {
                    const active = index === screeningStepIndex
                    const done = index < screeningStepIndex
                    return (
                      <li
                        key={step.id}
                        className={`rounded-lg px-3 py-2 text-sm border ${
                          active
                            ? 'border-blue-300 bg-blue-500/20 text-white'
                            : done
                              ? 'border-green-400/40 bg-green-500/10 text-green-100'
                              : 'border-white/10 text-slate-400'
                        }`}
                      >
                        {step.label}
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onToggleTranscript}
              className="inline-flex items-center gap-2 min-h-[44px] text-sm font-medium text-blue-100 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg px-2"
              aria-pressed={showTranscript}
            >
              <Captions className="w-4 h-4" aria-hidden="true" />
              {showTranscript ? 'Turn transcript off' : 'Turn transcript on'}
            </button>
          </div>
        </section>

        <div className="space-y-4">
          {!isIncoming && (
            <>
              <RiskMeter level={riskLevel} />
              <CallTranscript
                lines={TRANSCRIPT_LINES}
                visibleCount={transcriptIndex + 1}
                enabled={showTranscript}
              />
            </>
          )}
          {isIncoming && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-gray-700">
              <h3 className="font-semibold text-gray-900 mb-2">What happens next</h3>
              <p className="text-sm leading-relaxed">
                Answer the call to watch CallGuard screen the conversation with sample data. You can
                turn the transcript on or off at any time. This demo does not place a real phone call.
              </p>
            </div>
          )}
        </div>
      </div>

      {showHighAlert && (
        <section
          className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6"
          aria-labelledby="high-risk-heading"
        >
          <h2 id="high-risk-heading" className="text-xl sm:text-2xl font-bold text-red-900 mb-2">
            {CALL_SCENARIO.highRiskTitle}
          </h2>
          <p className="text-red-800 mb-4">{CALL_SCENARIO.highRiskBody}</p>
          <h3 className="text-sm font-semibold text-red-900 mb-2">Detected warning signals</h3>
          <ul className="grid sm:grid-cols-2 gap-2 mb-4">
            {WARNING_SIGNALS.map((signal) => (
              <li
                key={signal.id}
                className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-900"
              >
                {signal.label}
              </li>
            ))}
          </ul>
          {stage === 'highRisk' && onContinueToProtective && (
            <button
              type="button"
              onClick={onContinueToProtective}
              className="min-h-[48px] px-5 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Continue to protective actions
            </button>
          )}
        </section>
      )}
    </div>
  )
}
