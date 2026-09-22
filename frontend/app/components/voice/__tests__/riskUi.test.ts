import { describe, expect, it } from 'vitest'
import { mapRiskToUiState, getRiskWarningCopy, getProtectionLabel } from '../riskUi'
import type { RiskResponse } from '../../../callguard/api'

const lowRisk: RiskResponse = {
  score: 10,
  level: 'low',
  reasons: [],
  next_action: 'Continue',
  recommended_actions: [],
}

const mediumRisk: RiskResponse = {
  score: 45,
  level: 'medium',
  reasons: ['Urgency detected'],
  next_action: 'Be careful',
  recommended_actions: [],
}

const highRisk: RiskResponse = {
  score: 85,
  level: 'high',
  reasons: ['Verification code request', 'Remote access'],
  next_action: 'End call',
  recommended_actions: [],
}

describe('mapRiskToUiState', () => {
  it('maps trusted contact with low risk to trusted', () => {
    expect(
      mapRiskToUiState({
        risk: lowRisk,
        trustedCaller: { trusted: true, name: 'Mary' },
      })
    ).toBe('trusted')
  })

  it('maps pre-call trusted without risk to trusted', () => {
    expect(
      mapRiskToUiState({
        risk: null,
        trustedCaller: null,
        preCallTrusted: true,
      })
    ).toBe('trusted')
  })

  it('maps unknown number with no risk to unknown', () => {
    expect(
      mapRiskToUiState({
        risk: null,
        trustedCaller: { trusted: false },
      })
    ).toBe('unknown')
  })

  it('maps medium risk to possibleRisk even if trusted', () => {
    expect(
      mapRiskToUiState({
        risk: mediumRisk,
        trustedCaller: { trusted: true, name: 'Mary' },
      })
    ).toBe('possibleRisk')
  })

  it('maps high risk to highRisk', () => {
    expect(
      mapRiskToUiState({
        risk: highRisk,
        trustedCaller: null,
      })
    ).toBe('highRisk')
  })
})

describe('getRiskWarningCopy', () => {
  it('returns senior-friendly trusted copy', () => {
    const copy = getRiskWarningCopy('trusted')
    expect(copy.heading).toBe('Trusted contact')
    expect(copy.supporting).toMatch(/trusted contacts/i)
  })

  it('includes checklist for possible and high risk', () => {
    expect(getRiskWarningCopy('possibleRisk').checklist?.length).toBeGreaterThan(0)
    expect(getRiskWarningCopy('highRisk').checklist?.length).toBeGreaterThan(0)
  })
})

describe('getProtectionLabel', () => {
  it('returns plain-language labels', () => {
    expect(getProtectionLabel('trusted')).toBe('Trusted Contact')
    expect(getProtectionLabel('unknown')).toBe('Unknown Caller')
    expect(getProtectionLabel('possibleRisk')).toBe('Possible Risk')
    expect(getProtectionLabel('highRisk')).toBe('High-Risk Warning')
  })
})
