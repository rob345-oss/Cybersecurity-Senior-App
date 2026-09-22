'use client'

import { useState } from 'react'
import CallGuardClient from '../../callguard/CallGuardClient'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import VoiceCallPanel from '../../components/voice/VoiceCallPanel'

export default function DashboardCallGuardPage() {
  const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null)
  const [showCoaching, setShowCoaching] = useState(false)

  return (
    <>
      <DashboardHeader
        title="CallGuard"
        description="Protected calling with clear scam warnings — calm, simple, and easy to follow"
      />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <section className="xl:col-span-3">
          <VoiceCallPanel onSessionChange={setVoiceSessionId} />
        </section>
        <section className="xl:col-span-2">
          <div className="xl:hidden mb-4">
            <button
              type="button"
              onClick={() => setShowCoaching((v) => !v)}
              className="w-full min-h-[48px] rounded-xl border border-gray-200 bg-white px-4 text-lg font-semibold text-gray-900"
              aria-expanded={showCoaching}
            >
              {showCoaching ? 'Hide coaching signals' : 'Open coaching signals'}
            </button>
          </div>
          <div className={showCoaching ? 'block' : 'hidden xl:block'}>
            <CallGuardClient sharedSessionId={voiceSessionId} />
          </div>
        </section>
      </div>
    </>
  )
}
