import { describe, expect, it } from 'vitest'
import { applyDemoOverrides, scenarioToOverride } from '../demoMode'

describe('demoMode', () => {
  it('disables override when off', () => {
    expect(scenarioToOverride('off').enabled).toBe(false)
  })

  it('maps scenarios to risk and call phases', () => {
    expect(scenarioToOverride('trusted').riskUiState).toBe('trusted')
    expect(scenarioToOverride('unknown').riskUiState).toBe('unknown')
    expect(scenarioToOverride('possibleRisk').riskUiState).toBe('possibleRisk')
    expect(scenarioToOverride('highRisk').callPhase).toBe('active')
    expect(scenarioToOverride('failed').systemState).toBe('call-failed')
    expect(scenarioToOverride('offline').systemState).toBe('offline')
  })

  it('applies escalation override', () => {
    const demo = scenarioToOverride('escalate')
    const result = applyDemoOverrides({
      demo,
      callPhase: 'idle',
      riskUiState: 'unknown',
      systemState: 'ok',
      escalatedRisk: 'highRisk',
    })
    expect(result.callPhase).toBe('active')
    expect(result.riskUiState).toBe('highRisk')
  })
})
