'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { DemoModule } from '../demoData'

interface FeaturePanelProps {
  module: DemoModule
  actionResult?: string
  onClose: () => void
  onAction: () => void
}

export default function FeaturePanel({
  module,
  actionResult,
  onClose,
  onAction,
}: FeaturePanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`module-panel-${module.id}`}
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-gray-200 bg-white shadow-xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id={`module-panel-${module.id}`} className="text-xl font-bold text-gray-900">
              {module.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{module.summary}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Close ${module.title} panel`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">How it works</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{module.explanation}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{module.exampleTitle}</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {module.exampleBody}
            </p>
          </div>
          {module.disclaimer && (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {module.disclaimer}
            </p>
          )}
          <button
            type="button"
            onClick={onAction}
            className="w-full min-h-[48px] px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {module.actionLabel}
          </button>
          {actionResult && (
            <p className="text-sm text-green-900 bg-green-50 border border-green-200 rounded-lg px-3 py-2" role="status">
              {actionResult}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
