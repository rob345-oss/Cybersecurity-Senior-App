'use client'

import { useState, useMemo, useEffect } from 'react'
import { startSession, addEvent, getCurrentUser, RiskResponse } from './api'
import ChipGrid from './components/ChipGrid'
import RiskCard from './components/RiskCard'
import EmptyState from './components/EmptyState'

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
]

interface CallGuardClientProps {
  sharedSessionId?: string | null
}

export default function CallGuardClient({ sharedSessionId = null }: CallGuardClientProps) {
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
        title: "I'm on a call — help me",
        subtitle: 'Live coaching for suspicious callers',
      },
      {
        title: 'Before I send money',
        subtitle: 'Check payment risk fast',
      },
      {
        title: 'Check a message or link',
        subtitle: 'Inbox phishing triage',
      },
      {
        title: 'Identity protection steps',
        subtitle: 'Freeze credit checklist',
      },
    ],
    []
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
      setError('Please select at least one signal')
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
        setError('Please log in to use CallGuard. The backend requires authentication.')
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session. Please try again.'

      if (
        errorMessage.includes('401') ||
        errorMessage.includes('Authentication') ||
        errorMessage.includes('Unauthorized')
      ) {
        setError('Please log in to use CallGuard. The backend requires authentication.')
      } else if (
        errorMessage.includes('connect') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('Network')
      ) {
        setError(`Connection error: ${errorMessage}. Make sure the backend is running on port 8000.`)
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
    const summary = `Titanium Guardian CallGuard summary: ${risk.level} risk score ${risk.score}.`
    try {
      if (navigator.share) {
        await navigator.share({ text: summary })
      } else {
        await navigator.clipboard.writeText(summary)
        alert('Summary copied to clipboard')
      }
    } catch (shareError) {
      console.error('Failed to share summary:', shareError)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
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
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">I&apos;m on a call — help me</h2>
        <p className="text-sm text-gray-600 mb-6">Tap any signals you recognize while you&apos;re on the line.</p>

        <ChipGrid items={signals} selected={selectedSignals} onToggle={toggleSignal} />

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
            {loading ? 'Starting...' : 'Start Live Session'}
          </button>
          {sessionId && (
            <span className="text-sm text-gray-600">Session ID: {sessionId}</span>
          )}
        </div>
      </div>

      {!risk && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <EmptyState
            title="No session started yet"
            description="Select any signals you recognize during a call, then click 'Start Live Session' to get real-time coaching."
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
            Share summary
          </button>
        </div>
      )}
    </div>
  )
}
