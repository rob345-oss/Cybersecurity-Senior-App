/**
 * Local demo state machine — no server persistence, no production APIs.
 * Restarting resets all flags; a page refresh returns to welcome.
 */

import type { RiskLevel } from './demoData'
import { TRANSCRIPT_LINES } from './demoData'

export type DemoStage =
  | 'welcome'
  | 'incoming'
  | 'screening'
  | 'suspicious'
  | 'highRisk'
  | 'protective'
  | 'familyAlert'
  | 'dashboard'
  | 'completed'

export type ProtectiveActionId =
  | 'endCall'
  | 'blockCaller'
  | 'notifyFamily'
  | 'markSafe'
  | 'reportScam'

export interface DemoState {
  stage: DemoStage
  showTranscript: boolean
  screeningStepIndex: number
  transcriptIndex: number
  riskLevel: RiskLevel
  protectiveResults: Partial<Record<ProtectiveActionId, string>>
  callEnded: boolean
  showMarkSafeConfirm: boolean
  showSafetySummary: boolean
  familyAcknowledged: boolean
  activeModuleId: string | null
  moduleActionResults: Record<string, string>
  tourOpen: boolean
  tourStepIndex: number
  announcement: string
  declinedCall: boolean
}

export const initialDemoState = (): DemoState => ({
  stage: 'welcome',
  showTranscript: true,
  screeningStepIndex: -1,
  transcriptIndex: -1,
  riskLevel: 'low',
  protectiveResults: {},
  callEnded: false,
  showMarkSafeConfirm: false,
  showSafetySummary: false,
  familyAcknowledged: false,
  activeModuleId: null,
  moduleActionResults: {},
  tourOpen: false,
  tourStepIndex: 0,
  announcement: '',
  declinedCall: false,
})

export type DemoAction =
  | { type: 'START_DEMO' }
  | { type: 'EXPLORE_DASHBOARD' }
  | { type: 'ANSWER_CALL' }
  | { type: 'DECLINE_CALL' }
  | { type: 'TOGGLE_TRANSCRIPT' }
  | { type: 'SET_SCREENING_STEP'; index: number }
  | { type: 'REVEAL_TRANSCRIPT_LINE'; index: number }
  | { type: 'ENTER_PROTECTIVE' }
  | { type: 'APPLY_PROTECTIVE'; id: ProtectiveActionId; message: string }
  | { type: 'REQUEST_MARK_SAFE_CONFIRM' }
  | { type: 'CANCEL_MARK_SAFE' }
  | { type: 'CONFIRM_MARK_SAFE'; message: string }
  | { type: 'GO_FAMILY_ALERT' }
  | { type: 'ACK_FAMILY' }
  | { type: 'SHOW_SAFETY_SUMMARY' }
  | { type: 'HIDE_SAFETY_SUMMARY' }
  | { type: 'GO_DASHBOARD' }
  | { type: 'OPEN_MODULE'; id: string }
  | { type: 'CLOSE_MODULE' }
  | { type: 'MODULE_ACTION'; id: string; message: string }
  | { type: 'COMPLETE_DEMO' }
  | { type: 'OPEN_TOUR' }
  | { type: 'CLOSE_TOUR' }
  | { type: 'TOUR_NEXT' }
  | { type: 'TOUR_BACK' }
  | { type: 'RESTART' }
  | { type: 'ANNOUNCE'; message: string }
  | { type: 'REPLAY_CALL' }

function riskAnnouncement(level: RiskLevel): string {
  if (level === 'high') return 'Risk level: high scam risk detected.'
  if (level === 'suspicious') return 'Risk level: suspicious.'
  return 'Risk level: low.'
}

const RISK_ORDER: Record<RiskLevel, number> = {
  low: 0,
  suspicious: 1,
  high: 2,
}

/** Risk only escalates during the call scenario (Mark as Safe can lower it). */
function escalateRisk(current: RiskLevel, next?: RiskLevel): RiskLevel {
  if (!next) return current
  return RISK_ORDER[next] > RISK_ORDER[current] ? next : current
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'START_DEMO':
      return {
        ...initialDemoState(),
        stage: 'incoming',
        announcement: 'Incoming call simulation started.',
      }
    case 'EXPLORE_DASHBOARD':
      return {
        ...state,
        stage: 'dashboard',
        announcement: 'Exploring the Titanium Guardian dashboard demo.',
      }
    case 'ANSWER_CALL':
      return {
        ...state,
        stage: 'screening',
        screeningStepIndex: 0,
        declinedCall: false,
        announcement: 'Call answered. CallGuard screening begins.',
      }
    case 'DECLINE_CALL':
      return {
        ...state,
        stage: 'dashboard',
        declinedCall: true,
        callEnded: true,
        announcement: 'Call declined. You can explore the dashboard.',
      }
    case 'TOGGLE_TRANSCRIPT':
      return { ...state, showTranscript: !state.showTranscript }
    case 'SET_SCREENING_STEP': {
      const atEnd = action.index >= 4
      const riskLevel = atEnd ? escalateRisk(state.riskLevel, 'suspicious') : state.riskLevel
      return {
        ...state,
        screeningStepIndex: action.index,
        stage: atEnd ? 'suspicious' : 'screening',
        riskLevel,
        announcement: atEnd
          ? riskAnnouncement(riskLevel)
          : `Screening step ${action.index + 1}.`,
        transcriptIndex: atEnd && state.transcriptIndex < 0 ? 0 : state.transcriptIndex,
      }
    }
    case 'REVEAL_TRANSCRIPT_LINE': {
      const line = TRANSCRIPT_LINES[action.index]
      if (!line) return state
      const riskLevel = escalateRisk(state.riskLevel, line.riskAfter)
      const isHigh = riskLevel === 'high'
      const becameSuspicious =
        riskLevel === 'suspicious' && state.riskLevel !== 'suspicious' && !isHigh
      return {
        ...state,
        transcriptIndex: action.index,
        riskLevel,
        stage: isHigh ? 'highRisk' : riskLevel === 'suspicious' ? 'suspicious' : state.stage,
        announcement: isHigh
          ? riskAnnouncement('high')
          : becameSuspicious
            ? riskAnnouncement('suspicious')
            : state.announcement,
      }
    }
    case 'ENTER_PROTECTIVE':
      return {
        ...state,
        stage: 'protective',
        announcement: 'Protective actions are available.',
      }
    case 'APPLY_PROTECTIVE': {
      const callEnded = action.id === 'endCall' ? true : state.callEnded
      return {
        ...state,
        protectiveResults: {
          ...state.protectiveResults,
          [action.id]: action.message,
        },
        callEnded,
        announcement: action.message,
      }
    }
    case 'REQUEST_MARK_SAFE_CONFIRM':
      return { ...state, showMarkSafeConfirm: true }
    case 'CANCEL_MARK_SAFE':
      return { ...state, showMarkSafeConfirm: false }
    case 'CONFIRM_MARK_SAFE':
      return {
        ...state,
        showMarkSafeConfirm: false,
        riskLevel: 'low',
        protectiveResults: {
          ...state.protectiveResults,
          markSafe: action.message,
        },
        announcement: 'Call marked as safe for this demo session. Risk lowered.',
      }
    case 'GO_FAMILY_ALERT':
      return {
        ...state,
        stage: 'familyAlert',
        announcement: 'Simulated family alert ready.',
      }
    case 'ACK_FAMILY':
      return {
        ...state,
        familyAcknowledged: true,
        announcement: 'Sarah acknowledged the alert.',
      }
    case 'SHOW_SAFETY_SUMMARY':
      return { ...state, showSafetySummary: true }
    case 'HIDE_SAFETY_SUMMARY':
      return { ...state, showSafetySummary: false }
    case 'GO_DASHBOARD':
      return {
        ...state,
        stage: 'dashboard',
        showSafetySummary: false,
        announcement: 'Titanium Guardian dashboard demo.',
      }
    case 'OPEN_MODULE':
      return { ...state, activeModuleId: action.id }
    case 'CLOSE_MODULE':
      return { ...state, activeModuleId: null }
    case 'MODULE_ACTION':
      return {
        ...state,
        moduleActionResults: {
          ...state.moduleActionResults,
          [action.id]: action.message,
        },
        announcement: action.message,
      }
    case 'COMPLETE_DEMO':
      return {
        ...state,
        stage: 'completed',
        announcement: 'Demo completed. Thank you for exploring Titanium Guardian.',
      }
    case 'OPEN_TOUR':
      return { ...state, tourOpen: true, tourStepIndex: 0 }
    case 'CLOSE_TOUR':
      return { ...state, tourOpen: false }
    case 'TOUR_NEXT':
      return { ...state, tourStepIndex: Math.min(state.tourStepIndex + 1, 5) }
    case 'TOUR_BACK':
      return { ...state, tourStepIndex: Math.max(state.tourStepIndex - 1, 0) }
    case 'RESTART':
      return {
        ...initialDemoState(),
        announcement: 'Demo restarted.',
      }
    case 'ANNOUNCE':
      return { ...state, announcement: action.message }
    case 'REPLAY_CALL':
      return {
        ...initialDemoState(),
        stage: 'incoming',
        announcement: 'Replaying call scenario.',
      }
    default:
      return state
  }
}

export function isCallScenarioStage(stage: DemoStage): boolean {
  return (
    stage === 'incoming' ||
    stage === 'screening' ||
    stage === 'suspicious' ||
    stage === 'highRisk' ||
    stage === 'protective'
  )
}
