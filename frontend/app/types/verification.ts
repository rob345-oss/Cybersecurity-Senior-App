export type InteractionType =
  | 'call'
  | 'text'
  | 'email'
  | 'website'
  | 'payment_request'
  | 'other'

export type VerificationStatus =
  | 'pending'
  | 'likely_safe'
  | 'suspicious'
  | 'confirmed_scam'
  | 'needs_discussion'

export type ReviewStatus =
  | 'likely_safe'
  | 'suspicious'
  | 'confirmed_scam'
  | 'needs_discussion'

export type VerificationRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type ListRole = 'submitted' | 'review' | 'all'

export interface TrustedContact {
  id: string
  user_id: string
  contact_user_id: string
  contact_email?: string | null
  contact_name?: string | null
  label?: string | null
  created_at: string
}

export interface VerificationRequest {
  id: string
  user_id: string
  trusted_contact_id: string
  interaction_type: InteractionType
  sender_name?: string | null
  sender_contact?: string | null
  description: string
  requested_action?: string | null
  amount_requested?: string | number | null
  screenshot_url?: string | null
  risk_score?: number | null
  risk_level?: VerificationRiskLevel | null
  risk_reasons: string[]
  status: VerificationStatus
  reviewer_notes?: string | null
  reviewed_at?: string | null
  created_at: string
  updated_at: string
  submitter_name?: string | null
  submitter_email?: string | null
  trusted_contact_label?: string | null
  is_stale: boolean
}

export interface CreateVerificationRequestPayload {
  trusted_contact_id: string
  interaction_type: InteractionType
  description: string
  sender_name?: string
  sender_contact?: string
  requested_action?: string
  amount_requested?: number | null
}

export interface ReviewVerificationPayload {
  status: ReviewStatus
  reviewer_notes?: string
}

export interface RiskAnalysisResult {
  risk_score: number
  risk_level: VerificationRiskLevel
  risk_reasons: string[]
  summary: string
}

export const INTERACTION_TYPE_OPTIONS: { value: InteractionType; label: string }[] = [
  { value: 'call', label: 'Phone call' },
  { value: 'text', label: 'Text message' },
  { value: 'email', label: 'Email' },
  { value: 'website', label: 'Website' },
  { value: 'payment_request', label: 'Payment request' },
  { value: 'other', label: 'Something else' },
]

export const STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: 'Waiting for review',
  likely_safe: 'Likely safe',
  suspicious: 'Suspicious',
  confirmed_scam: 'Confirmed scam',
  needs_discussion: 'Needs discussion',
}

export const HIGH_RISK_WARNING =
  'Do not send money, share a verification code, install software, or give remote access until someone you trust has reviewed this request.'
