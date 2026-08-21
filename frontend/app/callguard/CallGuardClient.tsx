'use client'

import { useState, useMemo, useEffect } from 'react'
import { startSession, addEvent, getCurrentUser, RiskResponse } from './api'
import ChipGrid from './components/ChipGrid'
import RiskCard from './components/RiskCard'
import EmptyState from './components/EmptyState'
import { useTranslation } from '../i18n/LanguageProvider'
import { interpolate } from '../i18n/get-dictionary'

const signals = [
  'urgency',
  'bank_impersonation',
  'government_impersonation',
  'tech_support',
  'remote_access_request',
  'verification_code_request',
  'gift_cards',
  'crypto_payment',
  'threats_or_arrest',
  'too_good_to_be_true',
  'asks_to_keep_secret',
  'caller_id_mismatch',
] as const

interface CallGuardClientProps {
  sharedSessionId?: string | null
}

export default function CallGuardClient({ sharedSessionId = null }: CallGuardClientProps) {
  const { dictionary: d } = useTranslation()
  const [selectedSignals, setSelectedSignals] = useState<Set<string>>(new Set())
  const [risk, setRisk] = useState<RiskResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(sharedSessionId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sharedSessionId) {
      setSessionId(sharedSessionId)
    }
  }, [sharedSessionId])

  const quickActions = useMemo(
    () => [
      {
        title: d.dashboard.quickActionCall.title,
        subtitle: d.dashboard.quickActionCall.subtitle,
      },
      {
        title: d.dashboard.quickActionMoney.title,
        subtitle: d.dashboard.quickActionMoney.subtitle,
      },
      {
        title: d.dashboard.quickActionInbox.title,
        subtitle: d.dashboard.quickActionInbox.subtitle,
      },
      {
        title: d.dashboard.quickActionIdentity.title,
        subtitle: d.dashboard.quickActionIdentity.subtitle,
      },
    ],
    [d]
  )

  const toggleSignal = async (item: string) => {
    const activeSessionId = sessionId || sharedSessionId
    const wasSelected = selectedSignals.has(item)

    setSelectedSignals((prev) => {
      const next = new Set(prev)
      if (next.has(item)) {
        next.delete(item)
      } else {
        next.add(item)
      }
      return next
    })

    if (activeSessionId && !wasSelected) {
      try {
        const result = await addEvent(activeSessionId, {
          type: 'signal',
          payload: { signal_key: item, source: 'manual' },
          timestamp: new Date().toISOString(),
        })
        setRisk(result)
      } catch (err) {
        console.error('Failed to add signal during call:', err)
      }
    }
  }

  const handleStartSession = async () => {
    if (selectedSignals.size === 0) {
      setError(d.callguard.selectSignal)
      return
    }

    setLoading(true)
    setRisk(null)
    setError(null)

    try {
      let userId: string
      try {
        const user = await getCurrentUser()
        userId = user.id
      } catch {
        setError(d.callguard.loginRequired)
        setLoading(false)
        return
      }

      const activeId = sessionId || sharedSessionId
      const targetSessionId = activeId || (await startSession(userId)).session_id
      if (!activeId) setSessionId(targetSessionId)

      for (const signal of selectedSignals) {
        const event = {
          type: 'signal',
          payload: { signal_key: signal },
          timestamp: new Date().toISOString(),
        }
        const result = await addEvent(targetSessionId, event)
        setRisk(result)
      }
    } catch (err) {
      console.error('CallGuard error:', err)
      const errorMessage = err instanceof Error ? err.message : d.callguard.startFailed

      if (
        errorMessage.includes('401') ||
        errorMessage.includes('Authentication') ||
        errorMessage.includes('Unauthorized')
      ) {
        setError(d.callguard.loginRequired)
      } else if (
        errorMessage.includes('connect') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('Network')
      ) {
        setError(interpolate(d.callguard.connectionError, { message: errorMessage }))
      } else {
        setError(errorMessage)
      }
      setSessionId(null)
    } finally {
      setLoading(false)
    }
  }

  const shareSummary = async () => {
    if (!risk) return
    const summary = interpolate(d.callguard.shareText, {
      level: risk.level,
      score: risk.score,
    })
    try {
      if (navigator.share) {
        await navigator.share({ text: summary })
      } else {
        await navigator.clipboard.writeText(summary)
        alert(d.callguard.summaryCopied)
      }
    } catch (shareError) {
      console.error('Failed to share summary:', shareError)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{d.callguard.quickActions}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <div key={action.title} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <strong className="text-gray-900 block mb-1">{action.title}</strong>
              <p className="text-sm text-gray-600">{action.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{d.callguard.onCallHelp}</h2>
        <p className="text-sm text-gray-600 mb-6">{d.callguard.onCallHelpHint}</p>

        <ChipGrid items={[...signals]} selected={selectedSignals} onToggle={toggleSignal} />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            onClick={handleStartSession}
            disabled={loading || selectedSignals.size === 0}
          >
            {loading ? d.callguard.starting : d.callguard.startLiveSession}
          </button>
          {sessionId && (
            <span className="text-sm text-gray-600">
              {interpolate(d.callguard.sessionId, { id: sessionId })}
            </span>
          )}
        </div>
      </div>

      {!risk && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <EmptyState
            title={d.callguard.emptyTitle}
            description={d.callguard.emptyDescription}
            icon="📞"
          />
        </div>
      )}

      {risk && (
        <div className="space-y-4">
          <RiskCard risk={risk} />
          <button
            className="px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            onClick={shareSummary}
          >
            {d.callguard.shareSummary}
          </button>
        </div>
      )}
    </div>
  )
}
