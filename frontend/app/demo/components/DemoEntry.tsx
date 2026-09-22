'use client'

import { Play, LayoutDashboard } from 'lucide-react'
import DemoDisclosure from './DemoDisclosure'
import { DEMO_DISCLOSURES } from '../demoData'

interface DemoEntryProps {
  onStart: () => void
  onExploreDashboard: () => void
}

export default function DemoEntry({ onStart, onExploreDashboard }: DemoEntryProps) {
  return (
    <section
      className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 sm:px-10 py-10 sm:py-14 text-center"
      aria-labelledby="demo-welcome-heading"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-3">
        Interactive product demo
      </p>
      <h1
        id="demo-welcome-heading"
        className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-balance"
      >
        See Titanium Guardian in action
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
        Experience a simulated scam call and see how CallGuard analyzes risk, protects the call
        recipient, and alerts a trusted family member.
      </p>

      <div className="mb-10">
        <DemoDisclosure items={DEMO_DISCLOSURES} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 font-semibold"
        >
          <Play className="w-5 h-5" aria-hidden="true" />
          Start Demo
        </button>
        <button
          type="button"
          onClick={onExploreDashboard}
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 bg-white text-gray-900 border-2 border-gray-900 rounded-lg hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 font-semibold"
        >
          <LayoutDashboard className="w-5 h-5" aria-hidden="true" />
          Explore Dashboard
        </button>
      </div>
    </section>
  )
}
