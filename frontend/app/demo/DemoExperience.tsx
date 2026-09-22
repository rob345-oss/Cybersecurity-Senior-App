'use client'

import { useEffect, useMemo, useReducer, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DemoShell from './components/DemoShell'
import DemoEntry from './components/DemoEntry'
import SimulatedCall from './components/SimulatedCall'
import ProtectiveActions from './components/ProtectiveActions'
import FamilyAlert from './components/FamilyAlert'
import DemoDashboard from './components/DemoDashboard'
import DemoTour from './components/DemoTour'
import {
  PROTECTIVE_ACTIONS,
  SCREENING_STEPS,
  TRANSCRIPT_LINES,
  type DemoModule,
  type ProtectiveActionDef,
} from './demoData'
import { demoReducer, initialDemoState, isCallScenarioStage } from './demoState'
import { trackDemoEvent } from './useDemoAnalytics'
import { demoStepDelay, usePrefersReducedMotion } from './usePrefersReducedMotion'

export default function DemoExperience() {
  const [state, dispatch] = useReducer(demoReducer, undefined, initialDemoState)
  const reducedMotion = usePrefersReducedMotion()
  const router = useRouter()
  const openedTracked = useRef(false)

  const showingFamilyAlert = state.stage === 'familyAlert'
  const alertTime = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date()),
    [showingFamilyAlert]
  )

  useEffect(() => {
    if (openedTracked.current) return
    openedTracked.current = true
    trackDemoEvent('demo_opened')
  }, [])

  // Screening step timers — advance until the final scripted step, then enter analysis
  useEffect(() => {
    if (state.stage !== 'screening') return
    if (state.screeningStepIndex < 0) return
    const nextIndex = state.screeningStepIndex + 1
    // One step past the last visible step is what moves the demo into analysis.
    if (nextIndex > SCREENING_STEPS.length) return
    const t = window.setTimeout(() => {
      dispatch({ type: 'SET_SCREENING_STEP', index: nextIndex })
    }, demoStepDelay(reducedMotion, 900))
    return () => window.clearTimeout(t)
  }, [state.stage, state.screeningStepIndex, reducedMotion])

  // Transcript reveal timers after screening
  useEffect(() => {
    if (state.stage !== 'suspicious' && state.stage !== 'highRisk') return
    const next = state.transcriptIndex + 1
    if (next >= TRANSCRIPT_LINES.length) return
    const t = window.setTimeout(() => {
      dispatch({ type: 'REVEAL_TRANSCRIPT_LINE', index: next })
    }, demoStepDelay(reducedMotion, 1400))
    return () => window.clearTimeout(t)
  }, [state.stage, state.transcriptIndex, reducedMotion])

  // Auto-offer protective actions shortly after high risk is fully revealed
  useEffect(() => {
    if (state.stage !== 'highRisk') return
    if (state.transcriptIndex < TRANSCRIPT_LINES.length - 1) return
    const t = window.setTimeout(() => {
      dispatch({ type: 'ENTER_PROTECTIVE' })
    }, demoStepDelay(reducedMotion, 1200))
    return () => window.clearTimeout(t)
  }, [state.stage, state.transcriptIndex, reducedMotion])

  const handleExit = () => {
    trackDemoEvent('demo_exited')
  }

  const handleRestart = () => {
    dispatch({ type: 'RESTART' })
  }

  const handleProtective = (action: ProtectiveActionDef) => {
    if (action.id === 'markSafe') {
      if (state.protectiveResults.markSafe) return
      dispatch({ type: 'REQUEST_MARK_SAFE_CONFIRM' })
      return
    }
    if (state.protectiveResults[action.id]) return
    dispatch({ type: 'APPLY_PROTECTIVE', id: action.id, message: action.resultMessage })
  }

  const handleModuleAction = (module: DemoModule) => {
    dispatch({ type: 'MODULE_ACTION', id: module.id, message: module.actionResult })
    if (module.id === 'callguard') {
      dispatch({ type: 'REPLAY_CALL' })
      trackDemoEvent('demo_started')
    }
  }

  return (
    <DemoShell
      onRestart={handleRestart}
      onExit={handleExit}
      onOpenTour={() => dispatch({ type: 'OPEN_TOUR' })}
      showTourButton={state.stage !== 'welcome'}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {state.announcement}
      </div>

      {state.stage === 'welcome' && (
        <DemoEntry
          onStart={() => {
            trackDemoEvent('demo_started')
            dispatch({ type: 'START_DEMO' })
          }}
          onExploreDashboard={() => {
            trackDemoEvent('dashboard_explored')
            dispatch({ type: 'EXPLORE_DASHBOARD' })
          }}
        />
      )}

      {isCallScenarioStage(state.stage) && (
        <div className="space-y-6">
          <SimulatedCall
            stage={state.stage}
            showTranscript={state.showTranscript}
            screeningStepIndex={state.screeningStepIndex}
            transcriptIndex={state.transcriptIndex}
            riskLevel={state.riskLevel}
            onAnswer={() => dispatch({ type: 'ANSWER_CALL' })}
            onDecline={() => {
              trackDemoEvent('dashboard_explored')
              dispatch({ type: 'DECLINE_CALL' })
            }}
            onToggleTranscript={() => dispatch({ type: 'TOGGLE_TRANSCRIPT' })}
            onContinueToProtective={() => dispatch({ type: 'ENTER_PROTECTIVE' })}
          />
          {state.stage === 'protective' && (
            <ProtectiveActions
              results={state.protectiveResults}
              showMarkSafeConfirm={state.showMarkSafeConfirm}
              onAction={handleProtective}
              onConfirmMarkSafe={() => {
                const def = PROTECTIVE_ACTIONS.find((a) => a.id === 'markSafe')
                dispatch({
                  type: 'CONFIRM_MARK_SAFE',
                  message: def?.resultMessage ?? 'Risk lowered for this demo session only.',
                })
              }}
              onCancelMarkSafe={() => dispatch({ type: 'CANCEL_MARK_SAFE' })}
              onContinue={() => {
                trackDemoEvent('scenario_completed')
                dispatch({ type: 'GO_FAMILY_ALERT' })
              }}
            />
          )}
        </div>
      )}

      {state.stage === 'familyAlert' && (
        <FamilyAlert
          acknowledged={state.familyAcknowledged}
          showSummary={state.showSafetySummary}
          alertTime={alertTime}
          onAcknowledge={() => dispatch({ type: 'ACK_FAMILY' })}
          onViewSummary={() => dispatch({ type: 'SHOW_SAFETY_SUMMARY' })}
          onHideSummary={() => dispatch({ type: 'HIDE_SAFETY_SUMMARY' })}
          onContinue={() => {
            trackDemoEvent('dashboard_explored')
            dispatch({ type: 'GO_DASHBOARD' })
          }}
        />
      )}

      {state.stage === 'dashboard' && (
        <DemoDashboard
          activeModuleId={state.activeModuleId}
          moduleActionResults={state.moduleActionResults}
          onOpenModule={(id) => dispatch({ type: 'OPEN_MODULE', id })}
          onCloseModule={() => dispatch({ type: 'CLOSE_MODULE' })}
          onModuleAction={handleModuleAction}
          onComplete={() => dispatch({ type: 'COMPLETE_DEMO' })}
        />
      )}

      {state.stage === 'completed' && (
        <section
          className="rounded-2xl border border-gray-200 bg-white p-8 text-center max-w-xl mx-auto"
          aria-labelledby="demo-complete-heading"
        >
          <h2 id="demo-complete-heading" className="text-2xl font-bold text-gray-900 mb-3">
            Demo complete
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            You explored a simulated CallGuard scam call and the Titanium Guardian protection
            modules. Everything you saw used local sample data—no real calls or accounts were
            involved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handleRestart}
              className="min-h-[48px] px-5 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Restart Demo
            </button>
            <button
              type="button"
              onClick={() => {
                handleExit()
                router.push('/')
              }}
              className="min-h-[48px] px-5 py-3 rounded-lg border-2 border-gray-900 font-semibold hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Return to website
            </button>
          </div>
        </section>
      )}

      {state.tourOpen && (
        <DemoTour
          stepIndex={state.tourStepIndex}
          onNext={() => dispatch({ type: 'TOUR_NEXT' })}
          onBack={() => dispatch({ type: 'TOUR_BACK' })}
          onSkip={() => dispatch({ type: 'CLOSE_TOUR' })}
          onRestart={() => {
            dispatch({ type: 'CLOSE_TOUR' })
            handleRestart()
          }}
          onExit={() => {
            dispatch({ type: 'CLOSE_TOUR' })
            handleExit()
            router.push('/')
          }}
        />
      )}
    </DemoShell>
  )
}
