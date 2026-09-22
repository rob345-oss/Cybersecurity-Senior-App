'use client'

import { TOUR_STEPS } from '../demoData'

interface DemoTourProps {
  stepIndex: number
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onRestart: () => void
  onExit: () => void
}

export default function DemoTour({
  stepIndex,
  onNext,
  onBack,
  onSkip,
  onRestart,
  onExit,
}: DemoTourProps) {
  const step = TOUR_STEPS[stepIndex]
  const isLast = stepIndex >= TOUR_STEPS.length - 1

  if (!step) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl p-5 sm:p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-2">
          Guided tour · Step {stepIndex + 1} of {TOUR_STEPS.length}
        </p>
        <h2 id="tour-step-title" className="text-xl font-bold text-gray-900 mb-2">
          {step.title}
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">{step.body}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={onBack}
            disabled={stepIndex === 0}
            className="min-h-[44px] px-4 py-2 rounded-lg border border-gray-300 font-medium disabled:opacity-40 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Back
          </button>
          <button
            type="button"
            onClick={isLast ? onSkip : onNext}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isLast ? 'Done' : 'Next'}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[44px] px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Skip Tour
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onRestart}
            className="min-h-[44px] px-3 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Restart Demo
          </button>
          <button
            type="button"
            onClick={onExit}
            className="min-h-[44px] px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Exit Demo
          </button>
        </div>
      </div>
    </div>
  )
}
