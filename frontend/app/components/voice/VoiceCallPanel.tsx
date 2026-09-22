'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { addEvent } from '../../callguard/api'
import { listContacts, type Contact } from '../../contacts/api'
import { openSmsLink, shareText } from '../../utils/shareActions'
import ActiveCallControls from './ActiveCallControls'
import CallerIdentity from './CallerIdentity'
import CallGuardDemoControls, { useDemoOverride } from './CallGuardDemoControls'
import CallScreenShell from './CallScreenShell'
import {
  callerDisplayFromTrusted,
  contactToCallerDisplay,
  findContactByPhone,
  trustedInfoFromContact,
} from './contactMatch'
import { formatCallDuration } from './callState'
import DialPad from './DialPad'
import { applyDemoOverrides, DEMO_WARNING_SIGNS, type DemoScenario } from './demoMode'
import HowCallGuardProtects from './HowCallGuardProtects'
import IncomingCallModal from './IncomingCallModal'
import LiveTranscript from './LiveTranscript'
import ProtectionStatus from './ProtectionStatus'
import RiskWarningPanel from './RiskWarningPanel'
import { mapRiskToUiState, plainLanguageReasons } from './riskUi'
import SafetyTipsPanel from './SafetyTipsPanel'
import type { RiskUiState, SystemCallState } from './types'
import { useTwilioDevice } from './useTwilioDevice'
import { useVoiceWebSocket } from './useVoiceWebSocket'

interface VoiceCallPanelProps {
  onSessionChange?: (sessionId: string | null) => void
}

export default function VoiceCallPanel({ onSessionChange }: VoiceCallPanelProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [calling, setCalling] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)
  const [keypadOpen, setKeypadOpen] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [warningAcknowledged, setWarningAcknowledged] = useState(false)
  const [pendingUnknownConfirm, setPendingUnknownConfirm] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [online, setOnline] = useState(true)
  const [demoScenario, setDemoScenario] = useState<DemoScenario>('off')
  const [escalateTick, setEscalateTick] = useState(0)
  const [coachingOpen, setCoachingOpen] = useState(false)

  const demo = useDemoOverride(demoScenario)

  const {
    status,
    error: deviceError,
    incomingCall,
    activeCall,
    sessionId,
    muted,
    speakerOn,
    durationSeconds,
    connectOutbound,
    acceptIncoming,
    declineIncoming,
    hangUp,
    toggleMute,
    toggleSpeaker,
    sendDigits,
    callPhase: devicePhase,
    permissionDenied,
    callFailed,
    clearCallFailed,
    activeLabel,
    incomingCallerId,
    activeNumber,
  } = useTwilioDevice()

  const wsEnabled = Boolean(sessionId && activeCall)
  const {
    transcript,
    risk,
    signals,
    trustedCaller,
    connected,
    reset: resetWs,
  } = useVoiceWebSocket(sessionId, wsEnabled)

  useEffect(() => {
    onSessionChange?.(sessionId)
  }, [sessionId, onSessionChange])

  useEffect(() => {
    if (!activeCall) {
      resetWs()
      setWarningAcknowledged(false)
      setKeypadOpen(false)
    }
  }, [activeCall, resetWs])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const pageSize = 200
        const first = await listContacts({ trusted_only: false, page_size: pageSize, page: 1 })
        if (cancelled) return
        const all = [...first.contacts]
        const size = first.page_size || pageSize
        const pages = Math.min(Math.ceil(first.total / size), 10)
        for (let page = 2; page <= pages; page += 1) {
          const next = await listContacts({ trusted_only: false, page_size: size, page })
          if (cancelled) return
          all.push(...next.contacts)
        }
        setContacts(all)
      } catch {
        // Contacts optional for dialer matching
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const update = () => setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  // Mid-call escalation demo: start trusted, then flip to high risk
  useEffect(() => {
    if (demoScenario !== 'escalate') {
      setEscalateTick(0)
      return
    }
    setEscalateTick(0)
    const t = setTimeout(() => setEscalateTick(1), 2200)
    return () => clearTimeout(t)
  }, [demoScenario])

  const matchedContact = useMemo(
    () => findContactByPhone(contacts, phoneNumber || activeNumber),
    [contacts, phoneNumber, activeNumber]
  )

  const preCallTrusted = matchedContact?.is_trusted === true
  const preCallTrustedInfo = trustedInfoFromContact(matchedContact)

  // Keep a contact-book trust match for the whole call. The socket payload
  // can override it when the server confirms trust, but a missing or failed
  // lookup must not relabel a trusted person as unknown. High/medium risk
  // still wins inside mapRiskToUiState.
  const effectiveTrusted =
    trustedCaller?.trusted === true
      ? trustedCaller
      : preCallTrusted
        ? preCallTrustedInfo
        : null
  const liveRiskUi = mapRiskToUiState({
    risk,
    trustedCaller: effectiveTrusted,
    preCallTrusted: effectiveTrusted?.trusted === true,
  })

  const baseSystemState: SystemCallState = !online
    ? 'offline'
    : permissionDenied
      ? 'permission-denied'
      : status === 'loading' || status === 'idle'
        ? 'loading'
        : status === 'error'
          ? 'unavailable'
          : callFailed
            ? 'call-failed'
            : 'ok'

  const { callPhase, riskUiState, systemState } = applyDemoOverrides({
    demo,
    callPhase: devicePhase,
    riskUiState: liveRiskUi,
    systemState: baseSystemState,
    escalatedRisk: escalateTick > 0 ? 'highRisk' : 'trusted',
  })

  const demoActive = demo.enabled
  const showActive =
    callPhase === 'active' || callPhase === 'connecting' || callPhase === 'dialing'

  const displayPhone =
    activeCall || callPhase === 'active' || callPhase === 'connecting' || callPhase === 'dialing'
      ? activeNumber || phoneNumber || activeLabel
      : phoneNumber

  const caller = useMemo(() => {
    if (trustedCaller?.trusted) {
      return callerDisplayFromTrusted(displayPhone, trustedCaller)
    }
    if (matchedContact) {
      return contactToCallerDisplay(displayPhone || matchedContact.primary_phone || '', matchedContact)
    }
    if (demoActive && riskUiState === 'trusted') {
      return {
        phoneNumber: displayPhone || '+15551234567',
        displayName: 'Mary Smith',
        relationship: 'Daughter',
        isTrusted: true,
      }
    }
    return contactToCallerDisplay(displayPhone, null)
  }, [trustedCaller, matchedContact, displayPhone, demoActive, riskUiState])

  const warningSigns = useMemo(() => {
    if (demoActive && (riskUiState === 'possibleRisk' || riskUiState === 'highRisk')) {
      return plainLanguageReasons(risk, DEMO_WARNING_SIGNS)
    }
    return plainLanguageReasons(risk, signals)
  }, [demoActive, riskUiState, risk, signals])

  const shellTone =
    riskUiState === 'highRisk' ? 'alert' : riskUiState === 'possibleRisk' ? 'caution' : 'calm'

  const showElevatedWarning =
    (riskUiState === 'possibleRisk' || riskUiState === 'highRisk') && !warningAcknowledged

  const placeCall = useCallback(async () => {
    setCallError(null)
    setCalling(true)
    clearCallFailed()
    try {
      const result = await connectOutbound(phoneNumber)
      onSessionChange?.(result.sessionId)
      setPendingUnknownConfirm(false)
    } catch (err) {
      setCallError(err instanceof Error ? err.message : 'Failed to place call')
    } finally {
      setCalling(false)
    }
  }, [phoneNumber, connectOutbound, onSessionChange, clearCallFailed])

  const handleCallClick = async () => {
    if (!phoneNumber.trim()) return
    const ui = mapRiskToUiState({
      risk: null,
      trustedCaller: preCallTrustedInfo,
      preCallTrusted,
    })
    if (ui === 'unknown' && !pendingUnknownConfirm && !demoActive) {
      setPendingUnknownConfirm(true)
      return
    }
    await placeCall()
  }

  const handleAccept = async () => {
    try {
      const sid = await acceptIncoming()
      if (sid) onSessionChange?.(sid)
    } catch (err) {
      setCallError(err instanceof Error ? err.message : 'Failed to accept call')
    }
  }

  const handleAlertTrusted = async () => {
    setActionMessage(null)
    const trusted = contacts.find((c) => c.is_trusted && c.primary_phone)
    const message = `CallGuard alert: I may need help with a suspicious phone call${
      displayPhone ? ` from ${displayPhone}` : ''
    }. Please check on me.`
    if (trusted?.primary_phone) {
      const result = openSmsLink(trusted.primary_phone, message)
      setActionMessage(result.userMessage)
      return
    }
    const shared = await shareText(message, 'CallGuard alert')
    setActionMessage(
      shared.success
        ? shared.userMessage
        : 'No trusted contact with a phone number found. Add one in Contacts, or copy this message to text a family member.'
    )
  }

  const handleReport = async () => {
    setActionMessage(null)
    const payload = {
      phone: displayPhone,
      risk_level: riskUiState,
      signals: warningSigns,
      reported_at: new Date().toISOString(),
    }
    if (sessionId && !demoActive) {
      try {
        await addEvent(sessionId, {
          type: 'report_number',
          payload,
          timestamp: new Date().toISOString(),
        })
        setActionMessage('Thank you. We recorded your report for this call session.')
        return
      } catch {
        // fall through to local save
      }
    }
    try {
      const key = 'callguard_reported_numbers'
      const parsed = JSON.parse(localStorage.getItem(key) || '[]') as unknown
      const existing = Array.isArray(parsed) ? parsed : []
      existing.push(payload)
      localStorage.setItem(key, JSON.stringify(existing))
      setActionMessage(
        'Saved on this device for now. Full number reporting will sync when that service is available.'
      )
    } catch {
      setActionMessage('Could not save the report on this device. Please tell a trusted person about this number.')
    }
  }

  const handleAddTrusted = () => {
    window.location.href = '/dashboard/contacts'
  }

  const statusBanner = (() => {
    if (systemState === 'offline') {
      return {
        title: 'You appear to be offline',
        body: 'Check your internet connection. CallGuard needs a connection to protect this call.',
        tone: 'error' as const,
      }
    }
    if (systemState === 'permission-denied') {
      return {
        title: 'Microphone permission needed',
        body: 'Allow microphone access in your browser settings, then refresh this page to place or receive calls.',
        tone: 'error' as const,
      }
    }
    if (systemState === 'unavailable') {
      return {
        title: 'Phone unavailable',
        body:
          deviceError ||
          'Calling is not configured right now. You can still review safety tips below.',
        tone: 'error' as const,
      }
    }
    if (systemState === 'loading') {
      return {
        title: 'Connecting phone…',
        body: 'Please wait while CallGuard prepares your protected calling line.',
        tone: 'info' as const,
      }
    }
    if (systemState === 'call-failed' || callPhase === 'failed') {
      return {
        title: 'Call could not be completed',
        body: callError || 'Something went wrong placing the call. Please try again in a moment.',
        tone: 'error' as const,
      }
    }
    if (callPhase === 'ended') {
      return {
        title: 'Call ended',
        body: 'CallGuard is ready when you need it again.',
        tone: 'info' as const,
      }
    }
    if (status === 'ready' && !activeCall) {
      return {
        title: 'Phone ready',
        body: connected && wsEnabled ? 'Live protection active' : 'CallGuard protection is standing by',
        tone: 'ok' as const,
      }
    }
    return null
  })()

  const dialDisabled =
    systemState === 'offline' ||
    systemState === 'unavailable' ||
    systemState === 'permission-denied' ||
    systemState === 'loading' ||
    (status !== 'ready' && !demoActive)

  return (
    <div className="space-y-4">
      {process.env.NODE_ENV === 'development' && (
        <CallGuardDemoControls scenario={demoScenario} onScenarioChange={setDemoScenario} />
      )}

      {statusBanner && (
        <div
          role="status"
          className={
            statusBanner.tone === 'ok'
              ? 'rounded-xl border border-[var(--cg-trusted-border)] bg-[var(--cg-trusted-bg)] px-4 py-3 text-[var(--cg-trusted)]'
              : statusBanner.tone === 'error'
                ? 'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-900'
                : 'rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800'
          }
        >
          <p className="text-lg font-semibold">{statusBanner.title}</p>
          <p className="text-base mt-1 opacity-90">{statusBanner.body}</p>
          {deviceError?.includes('not configured') && (
            <p className="mt-2 text-sm">
              Configure Twilio env vars and set PUBLIC_API_URL for webhooks. See docs/TWILIO_VOICE_SETUP.md.
            </p>
          )}
        </div>
      )}

      {(deviceError || callError) && systemState === 'ok' && (
        <div role="alert" className="text-base text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {deviceError || callError}
        </div>
      )}

      {incomingCall && (() => {
        const incomingContact = findContactByPhone(contacts, incomingCallerId)
        const incomingTrusted = trustedInfoFromContact(incomingContact)
        return (
          <IncomingCallModal
            callerId={incomingCallerId}
            caller={contactToCallerDisplay(incomingCallerId, incomingContact)}
            riskState={mapRiskToUiState({
              risk: null,
              trustedCaller: incomingTrusted,
              preCallTrusted: incomingContact?.is_trusted === true,
            })}
            onAccept={handleAccept}
            onDecline={declineIncoming}
          />
        )
      })()}

      <CallScreenShell tone={shellTone}>
        {showActive ? (
          <div className="space-y-6">
            <CallerIdentity
              caller={caller}
              subtitle={
                callPhase === 'dialing' || callPhase === 'connecting'
                  ? 'Connecting…'
                  : formatCallDuration(
                      demoActive && !activeCall ? Math.max(durationSeconds, 12) : durationSeconds
                    )
              }
            />

            <div className="flex flex-col items-center gap-2">
              <ProtectionStatus state={riskUiState} monitoring />
              <p className="text-base text-center text-[var(--cg-ink-muted)] max-w-md">
                CallGuard is monitoring for scam indicators
              </p>
            </div>

            {showElevatedWarning && (
              <RiskWarningPanel
                state={riskUiState}
                warningSigns={warningSigns}
                inCall
                actionMessage={actionMessage}
                onContinueAnyway={() => setWarningAcknowledged(true)}
                onEndCall={() => {
                  if (activeCall) hangUp()
                  else setDemoScenario('off')
                }}
                onAlertTrusted={handleAlertTrusted}
                onReport={handleReport}
              />
            )}

            {!showElevatedWarning && riskUiState === 'trusted' && (
              <RiskWarningPanel state="trusted" />
            )}

            {keypadOpen && (
              <DialPad
                value=""
                onChange={() => {}}
                onCall={() => {}}
                digitsOnly
                onDigit={(d) => sendDigits(d)}
              />
            )}

            <ActiveCallControls
              muted={muted}
              speakerOn={speakerOn}
              keypadOpen={keypadOpen}
              onToggleMute={toggleMute}
              onToggleSpeaker={toggleSpeaker}
              onToggleKeypad={() => setKeypadOpen((v) => !v)}
              onHangUp={() => {
                if (activeCall) hangUp()
                else setDemoScenario('off')
              }}
              onAddTrusted={handleAddTrusted}
              isTrusted={caller.isTrusted || riskUiState === 'trusted'}
            />

            <SafetyTipsPanel />

            {(activeCall || transcript) && !demoActive && (
              <details className="rounded-2xl border border-gray-200 bg-white/80 open:shadow-sm">
                <summary className="min-h-[48px] cursor-pointer px-4 py-3 text-lg font-semibold text-[var(--cg-ink)]">
                  Live transcript
                </summary>
                <div className="px-2 pb-2">
                  <LiveTranscript transcript={transcript} signals={signals} />
                </div>
              </details>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              {phoneNumber.trim() ? (
                <CallerIdentity caller={caller} />
              ) : (
                <div className="text-center space-y-2 py-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--cg-ink)]">
                    Place a protected call
                  </h2>
                  <p className="text-lg text-[var(--cg-ink-muted)] max-w-md">
                    Enter a number. CallGuard watches for scam warning signs while you talk.
                  </p>
                </div>
              )}

              {phoneNumber.trim() && (
                <ProtectionStatus state={riskUiState} monitoring />
              )}
            </div>

            {pendingUnknownConfirm && riskUiState === 'unknown' && (
              <RiskWarningPanel
                state="unknown"
                onContinue={() => {
                  setPendingUnknownConfirm(false)
                  void placeCall()
                }}
                onAddTrusted={handleAddTrusted}
                onGoBack={() => setPendingUnknownConfirm(false)}
              />
            )}

            {demoActive && riskUiState === 'unknown' && !pendingUnknownConfirm && (
              <RiskWarningPanel
                state="unknown"
                onContinue={() => setDemoScenario('off')}
                onAddTrusted={handleAddTrusted}
                onGoBack={() => setDemoScenario('off')}
              />
            )}

            {demoActive &&
              (riskUiState === 'possibleRisk' || riskUiState === 'highRisk') &&
              callPhase === 'idle' && (
                <RiskWarningPanel
                  state={riskUiState}
                  warningSigns={warningSigns}
                  actionMessage={actionMessage}
                  onContinueAnyway={() => setDemoScenario('off')}
                  onGoBack={() => setDemoScenario('off')}
                  onAlertTrusted={handleAlertTrusted}
                  onReport={handleReport}
                />
              )}

            {!pendingUnknownConfirm && (
              <>
                <DialPad
                  value={phoneNumber}
                  onChange={(v) => {
                    setPhoneNumber(v)
                    setPendingUnknownConfirm(false)
                    clearCallFailed()
                  }}
                  onCall={handleCallClick}
                  disabled={dialDisabled}
                  loading={calling}
                />
                <HowCallGuardProtects />
                <p className="text-base text-[var(--cg-ink-muted)] text-center">
                  Place or receive calls in your browser. CallGuard shows warnings only — you decide
                  when to hang up.
                </p>
                <p className="text-center">
                  <Link
                    href="/dashboard/contacts"
                    className="text-lg font-semibold text-[var(--cg-trusted)] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 rounded"
                  >
                    Manage trusted contacts
                  </Link>
                </p>
              </>
            )}
          </div>
        )}
      </CallScreenShell>

      {/* Mobile coaching toggle hook used by parent page via optional slot — keep local collapse for transcript-adjacent help */}
      <button
        type="button"
        className="xl:hidden w-full min-h-[48px] rounded-xl border border-gray-200 bg-white text-lg font-semibold text-[var(--cg-ink)]"
        onClick={() => setCoachingOpen((v) => !v)}
        aria-expanded={coachingOpen}
      >
        {coachingOpen ? 'Hide call help' : 'Need help deciding? Open call coaching'}
      </button>
      {coachingOpen && (
        <p className="xl:hidden text-base text-[var(--cg-ink-muted)] px-1">
          Use the coaching panel below this phone to mark warning signs you notice during a call.
        </p>
      )}
    </div>
  )
}
