/** CallGuard voice UI presentation types — separate from Twilio device status. */

export type CallPhase = 'idle' | 'dialing' | 'connecting' | 'active' | 'ended' | 'failed'

export type RiskUiState = 'trusted' | 'unknown' | 'possibleRisk' | 'highRisk'

export type SystemCallState =
  | 'ok'
  | 'loading'
  | 'unavailable'
  | 'permission-denied'
  | 'call-failed'
  | 'offline'

export interface TrustedCallerInfo {
  trusted: boolean
  contact_id?: string | null
  name?: string | null
  relationship?: string | null
  source?: string | null
  normalized_phone?: string | null
  trusted_caller_id?: string | null
  photo_url?: string | null
}

export interface CallerDisplay {
  phoneNumber: string
  displayName: string
  photoUrl?: string | null
  relationship?: string | null
  isTrusted: boolean
  contactId?: string | null
}

export interface RiskWarningCopy {
  heading: string
  supporting: string
  checklist?: string[]
}

export interface DemoOverride {
  enabled: boolean
  callPhase?: CallPhase
  riskUiState?: RiskUiState
  systemState?: SystemCallState
  escalateDuringCall?: boolean
}
