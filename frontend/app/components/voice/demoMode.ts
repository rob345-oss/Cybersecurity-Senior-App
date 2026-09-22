'use client'

import type { CallPhase, DemoOverride, RiskUiState, SystemCallState } from './types'

export type DemoScenario =
  | 'off'
  | 'trusted'
  | 'unknown'
  | 'possibleRisk'
  | 'highRisk'
  | 'escalate'
  | 'failed'
  | 'offline'

export function scenarioToOverride(scenario: DemoScenario): DemoOverride {
  switch (scenario) {
    case 'off':
      return { enabled: false }
    case 'trusted':
      return {
        enabled: true,
        callPhase: 'idle',
        riskUiState: 'trusted',
        systemState: 'ok',
      }
    case 'unknown':
      return {
        enabled: true,
        callPhase: 'idle',
        riskUiState: 'unknown',
        systemState: 'ok',
      }
    case 'possibleRisk':
      return {
        enabled: true,
        callPhase: 'active',
        riskUiState: 'possibleRisk',
        systemState: 'ok',
      }
    case 'highRisk':
      return {
        enabled: true,
        callPhase: 'active',
        riskUiState: 'highRisk',
        systemState: 'ok',
      }
    case 'escalate':
      return {
        enabled: true,
        callPhase: 'active',
        riskUiState: 'trusted',
        escalateDuringCall: true,
        systemState: 'ok',
      }
    case 'failed':
      return {
        enabled: true,
        callPhase: 'failed',
        riskUiState: 'unknown',
        systemState: 'call-failed',
      }
    case 'offline':
      return {
        enabled: true,
        callPhase: 'idle',
        riskUiState: 'unknown',
        systemState: 'offline',
      }
  }
}

export function applyDemoOverrides(input: {
  demo: DemoOverride
  callPhase: CallPhase
  riskUiState: RiskUiState
  systemState: SystemCallState
  escalatedRisk?: RiskUiState
}): {
  callPhase: CallPhase
  riskUiState: RiskUiState
  systemState: SystemCallState
} {
  if (!input.demo.enabled) {
    return {
      callPhase: input.callPhase,
      riskUiState: input.riskUiState,
      systemState: input.systemState,
    }
  }
  return {
    callPhase: input.demo.callPhase ?? input.callPhase,
    riskUiState:
      input.demo.escalateDuringCall && input.escalatedRisk
        ? input.escalatedRisk
        : input.demo.riskUiState ?? input.riskUiState,
    systemState: input.demo.systemState ?? input.systemState,
  }
}

export const DEMO_WARNING_SIGNS = [
  'verification_code_request',
  'urgency',
  'remote_access_request',
]
