'use client'

import { useEffect, useState } from 'react'
import RiskCard from '../../callguard/components/RiskCard'
import ActiveCallBar from './ActiveCallBar'
import DialPad from './DialPad'
import IncomingCallModal from './IncomingCallModal'
import LiveTranscript from './LiveTranscript'
import { useTwilioDevice } from './useTwilioDevice'
import { useVoiceWebSocket } from './useVoiceWebSocket'

interface VoiceCallPanelProps {
  onSessionChange?: (sessionId: string | null) => void
}

export default function VoiceCallPanel({ onSessionChange }: VoiceCallPanelProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [calling, setCalling] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)

  const {
    status,
    error: deviceError,
    incomingCall,
    activeCall,
    sessionId,
    muted,
    durationSeconds,
    connectOutbound,
    acceptIncoming,
    declineIncoming,
    hangUp,
    toggleMute,
    incomingCallerId,
    activeLabel,
  } = useTwilioDevice()

  const wsEnabled = Boolean(sessionId && activeCall)
  const { transcript, risk, signals, connected } = useVoiceWebSocket(sessionId, wsEnabled)

  useEffect(() => {
    onSessionChange?.(sessionId)
  }, [sessionId, onSessionChange])

  const handleCall = async () => {
    setCallError(null)
    setCalling(true)
    try {
      const result = await connectOutbound(phoneNumber)
      onSessionChange?.(result.sessionId)
    } catch (err) {
      setCallError(err instanceof Error ? err.message : 'Failed to place call')
    } finally {
      setCalling(false)
    }
  }

  const handleAccept = async () => {
    try {
      const sid = await acceptIncoming()
      if (sid) onSessionChange?.(sid)
    } catch (err) {
      setCallError(err instanceof Error ? err.message : 'Failed to accept call')
    }
  }

  const statusLabel =
    status === 'ready'
      ? 'Phone ready'
      : status === 'loading'
        ? 'Connecting phone…'
        : status === 'on-call'
          ? 'On call'
          : status === 'error'
            ? 'Phone unavailable'
            : 'Initializing…'

  const statusColor =
    status === 'ready' || status === 'on-call'
      ? 'text-green-700 bg-green-50 border-green-200'
      : status === 'error'
        ? 'text-red-700 bg-red-50 border-red-200'
        : 'text-gray-600 bg-gray-50 border-gray-200'

  return (
    <div className="space-y-4">
      <div className={`text-sm font-medium px-3 py-2 rounded-lg border ${statusColor}`}>
        {statusLabel}
        {connected && wsEnabled && (
          <span className="ml-2 text-xs text-green-600">Live analysis active</span>
        )}
      </div>

      {(deviceError || callError) && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {deviceError || callError}
          {deviceError?.includes('not configured') && (
            <p className="mt-1 text-xs">
              Configure Twilio env vars and set PUBLIC_API_URL for webhooks. See docs/TWILIO_VOICE_SETUP.md.
            </p>
          )}
        </div>
      )}

      {incomingCall && (
        <IncomingCallModal
          callerId={incomingCallerId}
          onAccept={handleAccept}
          onDecline={declineIncoming}
        />
      )}

      {activeCall && (
        <ActiveCallBar
          label={activeLabel}
          durationSeconds={durationSeconds}
          muted={muted}
          onToggleMute={toggleMute}
          onHangUp={hangUp}
        />
      )}

      {!activeCall && status !== 'error' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Phone</h2>
          <DialPad
            value={phoneNumber}
            onChange={setPhoneNumber}
            onCall={handleCall}
            disabled={status !== 'ready'}
            loading={calling}
          />
          <p className="mt-4 text-xs text-gray-500">
            Place or receive calls through your browser. CallGuard analyzes speech in real time and
            shows warnings only—you decide when to hang up.
          </p>
        </div>
      )}

      {(activeCall || transcript) && (
        <LiveTranscript transcript={transcript} signals={signals} />
      )}

      {risk && (
        <div className="space-y-3">
          {risk.level === 'high' && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900 text-sm">
              <strong>High risk detected.</strong> Consider ending the call if something feels wrong.
              This is guidance only—the app will not hang up for you.
            </div>
          )}
          {risk.level === 'medium' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
              <strong>Elevated risk.</strong> Stay cautious and avoid sharing codes or payment details.
            </div>
          )}
          <RiskCard risk={risk} />
        </div>
      )}
    </div>
  )
}
