'use client'

import { useState } from 'react'
import CallGuardClient from '../../callguard/CallGuardClient'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import VoiceCallPanel from '../../components/voice/VoiceCallPanel'

export default function DashboardCallGuardPage() {
  const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null)

  return (
    <>
      <DashboardHeader
        title="CallGuard"
        description="Live coaching for suspicious calls — phone and manual signals"
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section>
          <VoiceCallPanel onSessionChange={setVoiceSessionId} />
        </section>
        <section>
          <CallGuardClient sharedSessionId={voiceSessionId} />
        </section>
      </div>
    </>
  )
}
