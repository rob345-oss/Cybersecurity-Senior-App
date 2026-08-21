'use client'

import { useState } from 'react'
import CallGuardClient from '../../callguard/CallGuardClient'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import VoiceCallPanel from '../../components/voice/VoiceCallPanel'
import { useTranslation } from '../../i18n/LanguageProvider'

export default function DashboardCallGuardPage() {
  const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null)
  const { dictionary: d } = useTranslation()

  return (
    <>
      <DashboardHeader
        title={d.dashboard.guards.callguard.title}
        description={d.dashboard.guards.callguard.pageDescription}
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
