'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ActiveCallControls from '../../components/voice/ActiveCallControls'
import CallerIdentity from '../../components/voice/CallerIdentity'
import CallGuardDemoControls from '../../components/voice/CallGuardDemoControls'
import CallScreenShell from '../../components/voice/CallScreenShell'
import DialPad from '../../components/voice/DialPad'
import {
  applyDemoOverrides,
  DEMO_WARNING_SIGNS,
  type DemoScenario,
} from '../../components/voice/demoMode'
import { useDemoOverride } from '../../components/voice/CallGuardDemoControls'
import HowCallGuardProtects from '../../components/voice/HowCallGuardProtects'
import ProtectionStatus from '../../components/voice/ProtectionStatus'
import RiskWarningPanel from '../../components/voice/RiskWarningPanel'
import SafetyTipsPanel from '../../components/voice/SafetyTipsPanel'
import { formatCallDuration } from '../../components/voice/callState'
import { plainLanguageReasons } from '../../components/voice/riskUi'

/**
 * Development-only gallery for CallGuard calling UI states.
 * Not linked from production nav. Production builds redirect away.
 */
export default function CallGuardPreviewPage() {
  const router = useRouter()
  const [scenario, setScenario] = useState<DemoScenario>('trusted')
  const [phone, setPhone] = useState('+13015550192')
  const [escalateTick, setEscalateTick] = useState(0)
  const [acknowledged, setAcknowledged] = useState(false)
  const demo = useDemoOverride(scenario)

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      router.replace('/dashboard/callguard')
    }
  }, [router])

  useEffect(() => {
    setAcknowledged(false)
    if (scenario !== 'escalate') {
      setEscalateTick(0)
      return
    }
    setEscalateTick(0)
    const t = setTimeout(() => setEscalateTick(1), 1800)
    return () => clearTimeout(t)
  }, [scenario])

  const { callPhase, riskUiState, systemState } = applyDemoOverrides({
    demo,
    callPhase: 'idle',
    riskUiState: 'unknown',
    systemState: 'ok',
    escalatedRisk: escalateTick > 0 ? 'highRisk' : 'trusted',
  })

  const caller = useMemo(() => {
    if (riskUiState === 'trusted') {
      return {
        phoneNumber: phone,
        displayName: 'Mary Smith',
        relationship: 'Daughter',
        isTrusted: true,
      }
    }
    return {
      phoneNumber: phone,
      displayName: phone,
      isTrusted: false,
    }
  }, [riskUiState, phone])

  const showActive = callPhase === 'active' || callPhase === 'connecting' || callPhase === 'dialing'
  const shellTone =
    riskUiState === 'highRisk' ? 'alert' : riskUiState === 'possibleRisk' ? 'caution' : 'calm'
  const showWarning =
    (riskUiState === 'possibleRisk' || riskUiState === 'highRisk' || riskUiState === 'unknown') &&
    !acknowledged

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-teal-50/40 p-4 sm:p-8">
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">
            Titanium Guardian · Dev preview
          </p>
          <h1 className="text-3xl font-bold text-[var(--cg-ink)] mt-1">CallGuard UI</h1>
          <p className="text-lg text-[var(--cg-ink-muted)] mt-1">
            Preview calling and warning states without Twilio.
          </p>
        </div>

        <CallGuardDemoControls scenario={scenario} onScenarioChange={setScenario} />

        {systemState !== 'ok' && (
          <div
            role="status"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-900 text-lg"
          >
            {systemState === 'offline' && 'You appear to be offline'}
            {systemState === 'call-failed' && 'Call could not be completed'}
            {systemState === 'unavailable' && 'Phone unavailable'}
            {systemState === 'permission-denied' && 'Microphone permission needed'}
            {systemState === 'loading' && 'Connecting phone…'}
          </div>
        )}

        <CallScreenShell tone={shellTone}>
          {showActive ? (
            <div className="space-y-6">
              <CallerIdentity caller={caller} subtitle={formatCallDuration(94)} />
              <div className="flex flex-col items-center gap-2">
                <ProtectionStatus state={riskUiState} monitoring />
                <p className="text-base text-center text-[var(--cg-ink-muted)]">
                  CallGuard is monitoring for scam indicators
                </p>
              </div>
              {showWarning && riskUiState !== 'unknown' && (
                <RiskWarningPanel
                  state={riskUiState}
                  inCall
                  warningSigns={plainLanguageReasons(null, DEMO_WARNING_SIGNS)}
                  onContinueAnyway={() => setAcknowledged(true)}
                  onEndCall={() => setScenario('off')}
                  onAlertTrusted={() => {}}
                  onReport={() => {}}
                />
              )}
              {!showWarning && riskUiState === 'trusted' && <RiskWarningPanel state="trusted" />}
              <ActiveCallControls
                muted={false}
                speakerOn={false}
                keypadOpen={false}
                onToggleMute={() => {}}
                onToggleSpeaker={() => {}}
                onToggleKeypad={() => {}}
                onHangUp={() => setScenario('off')}
                isTrusted={riskUiState === 'trusted'}
              />
              <SafetyTipsPanel />
            </div>
          ) : (
            <div className="space-y-6">
              <CallerIdentity caller={caller} />
              <div className="flex justify-center">
                <ProtectionStatus state={riskUiState} monitoring />
              </div>
              {riskUiState === 'unknown' && showWarning && (
                <RiskWarningPanel
                  state="unknown"
                  onContinue={() => setAcknowledged(true)}
                  onAddTrusted={() => {}}
                  onGoBack={() => setScenario('off')}
                />
              )}
              {(riskUiState === 'possibleRisk' || riskUiState === 'highRisk') && showWarning && (
                <RiskWarningPanel
                  state={riskUiState}
                  warningSigns={plainLanguageReasons(null, DEMO_WARNING_SIGNS)}
                  onContinueAnyway={() => setAcknowledged(true)}
                  onGoBack={() => setScenario('off')}
                  onAlertTrusted={() => {}}
                  onReport={() => {}}
                />
              )}
              {riskUiState === 'trusted' && <RiskWarningPanel state="trusted" />}
              <DialPad value={phone} onChange={setPhone} onCall={() => setScenario('possibleRisk')} />
              <HowCallGuardProtects />
            </div>
          )}
        </CallScreenShell>
      </div>
    </div>
  )
}
