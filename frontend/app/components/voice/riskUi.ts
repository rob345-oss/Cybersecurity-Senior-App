import type { RiskResponse } from '../../callguard/api'
import type { RiskUiState, RiskWarningCopy, TrustedCallerInfo } from './types'

export interface MapRiskInput {
  risk: RiskResponse | null
  trustedCaller: TrustedCallerInfo | null
  /** Pre-call trusted match from contacts list when no live risk yet */
  preCallTrusted?: boolean
}

export function mapRiskToUiState(input: MapRiskInput): RiskUiState {
  const level = (input.risk?.level || '').toLowerCase()

  if (level.includes('high')) return 'highRisk'
  if (level.includes('medium')) return 'possibleRisk'

  const isTrusted =
    input.trustedCaller?.trusted === true || input.preCallTrusted === true

  if (isTrusted) return 'trusted'
  return 'unknown'
}

export function getRiskWarningCopy(state: RiskUiState): RiskWarningCopy {
  switch (state) {
    case 'trusted':
      return {
        heading: 'Trusted contact',
        supporting: 'This person is in your trusted contacts.',
      }
    case 'unknown':
      return {
        heading: 'Unknown number',
        supporting: 'CallGuard does not recognize this caller yet.',
      }
    case 'possibleRisk':
      return {
        heading: 'Be careful with this call',
        supporting:
          'This number or conversation may contain signs associated with phone scams.',
        checklist: [
          'Never share verification codes',
          'Never send money under pressure',
          'Never allow remote access to your device',
        ],
      }
    case 'highRisk':
      return {
        heading: 'High-risk scam warning',
        supporting:
          'CallGuard detected multiple warning signs. We strongly recommend ending this call.',
        checklist: [
          'Never share verification codes',
          'Never send money under pressure',
          'Never allow remote access to your device',
        ],
      }
  }
}

export function getProtectionLabel(state: RiskUiState): string {
  switch (state) {
    case 'trusted':
      return 'Trusted Contact'
    case 'unknown':
      return 'Unknown Caller'
    case 'possibleRisk':
      return 'Possible Risk'
    case 'highRisk':
      return 'High-Risk Warning'
  }
}

/** Human-readable signal labels — no jargon. */
export function formatSignalLabel(signal: string): string {
  return signal.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function plainLanguageReasons(
  risk: RiskResponse | null,
  signals: string[]
): string[] {
  const reasons = risk?.reasons?.filter(Boolean) ?? []
  if (reasons.length > 0) return reasons
  return signals.map(formatSignalLabel)
}
