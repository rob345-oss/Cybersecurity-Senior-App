'use client'

import { useState, useMemo } from 'react'
import { startSession, addEvent, RiskResponse } from './api'
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

export default function CallGuardClient() {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/43eae5cd-d1bf-470d-b257-f562a708e1f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CallGuardClient.tsx:24',message:'CallGuardClient component mounting',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  
  const [selectedSignals, setSelectedSignals] = useState<Set<string>>(new Set())
  const [risk, setRisk] = useState<RiskResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/43eae5cd-d1bf-470d-b257-f562a708e1f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CallGuardClient.tsx:32',message:'CallGuardClient state initialized',data:{signalsCount:signals.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion

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

  const toggleSignal = (item: string) => {
    setSelectedSignals((prev) => {
      const next = new Set(prev)
      if (next.has(item)) {
        next.delete(item)
      } else {
        next.add(item)
      }
      return next
    })
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
      // Get current user from API
      const { getCurrentUser } = await import('./api')
      let userId: string
      try {
        const user = await getCurrentUser()
        userId = user.id
      } catch (authError) {
        setError('Please log in to use CallGuard. The backend requires authentication.')
        setLoading(false)
        return
      }

      const response = await startSession(userId)
      setSessionId(response.session_id)

      // Add all selected signals as events
      for (const signal of selectedSignals) {
        const event = {
          type: 'signal',
          payload: { signal_key: signal },
          timestamp: new Date().toISOString(),
        }
        const result = await addEvent(response.session_id, event)
        setRisk(result)
      }
    } catch (err) {
      console.error('CallGuard error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session. Please try again.'
      
      // Check if it's an auth error
      if (errorMessage.includes('401') || errorMessage.includes('Authentication') || errorMessage.includes('Unauthorized')) {
        setError('Please log in to use CallGuard. The backend requires authentication.')
      } else if (errorMessage.includes('connect') || errorMessage.includes('fetch') || errorMessage.includes('Network')) {
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
    } catch (error) {
      console.error('Failed to share summary:', error)
    }
  }

  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/43eae5cd-d1bf-470d-b257-f562a708e1f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CallGuardClient.tsx:140',message:'CallGuardClient about to render JSX',data:{selectedSignalsCount:selectedSignals.size,hasRisk:!!risk,hasError:!!error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  }
  // #endregion
  
  return (
    <div className="space-y-6">
      {/* Quick Actions Card */}
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

      {/* Main CallGuard Interface */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">I'm on a call — help me</h2>
        <p className="text-sm text-gray-600 mb-6">Tap any signals you recognize while you're on the line.</p>
        
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

      {/* Empty State */}
      {!risk && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <EmptyState
            title="No session started yet"
            description="Select any signals you recognize during a call, then click 'Start Live Session' to get real-time coaching."
            icon="📞"
          />
        </div>
      )}

      {/* Risk Results */}
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

