'use client'

import Link from 'next/link'
import { Info, RotateCcw, X } from 'lucide-react'
import { DEMO_BADGE_TOOLTIP } from '../demoData'

interface DemoShellProps {
  children: React.ReactNode
  onRestart: () => void
  onExit?: () => void
  onOpenTour?: () => void
  showTourButton?: boolean
}

export default function DemoShell({
  children,
  onRestart,
  onExit,
  onOpenTour,
  showTourButton = true,
}: DemoShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50 text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <p className="text-lg font-bold text-gray-900 truncate">Titanium Guardian</p>
            <div className="relative group shrink-0">
              <span
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900"
                tabIndex={0}
                aria-describedby="demo-badge-help"
              >
                Simulated Demo
                <Info className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
              <p
                id="demo-badge-help"
                role="tooltip"
                className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 text-xs font-normal normal-case tracking-normal text-gray-700 shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
              >
                {DEMO_BADGE_TOOLTIP}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {showTourButton && onOpenTour && (
              <button
                type="button"
                onClick={onOpenTour}
                className="min-h-[44px] px-3 py-2 text-sm font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Guided Tour
              </button>
            )}
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Restart Demo
            </button>
            <Link
              href="/"
              onClick={onExit}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              Exit Demo
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</main>
    </div>
  )
}
