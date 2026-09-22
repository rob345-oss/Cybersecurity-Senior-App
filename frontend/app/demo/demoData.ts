/**
 * INTENTIONALLY LOCAL & DETERMINISTIC MOCK DATA
 * ---------------------------------------------
 * This file powers the public /demo experience only.
 * Nothing here calls OpenAI, Twilio, auth providers, payment processors,
 * email/SMS services, external databases, or production APIs.
 * All responses are scripted for investor / visitor simulation.
 */

export type RiskLevel = 'low' | 'suspicious' | 'high'

export type TranscriptSpeaker = 'caller' | 'recipient' | 'callguard'

export interface TranscriptLine {
  id: string
  speaker: TranscriptSpeaker
  text: string
  /** Risk level after this line is revealed */
  riskAfter?: RiskLevel
}

export interface ScreeningStep {
  id: string
  label: string
}

export interface WarningSignal {
  id: string
  label: string
}

export interface ProtectiveActionDef {
  id: 'endCall' | 'blockCaller' | 'notifyFamily' | 'markSafe' | 'reportScam'
  label: string
  activeLabel: string
  resultMessage: string
  requiresConfirm?: boolean
  confirmTitle?: string
  confirmBody?: string
}

export interface DemoModuleId {
  id: 'callguard' | 'inboxguard' | 'moneyguard' | 'identitywatch' | 'webguardian' | 'carecircle'
}

export interface DemoModule extends DemoModuleId {
  title: string
  summary: string
  stats: { label: string; value: string }[]
  explanation: string
  exampleTitle: string
  exampleBody: string
  actionLabel: string
  actionResult: string
  disclaimer?: string
}

export const DEMO_DISCLOSURES = [
  'Simulated experience',
  'No real calls or personal data',
  'No signup required',
] as const

export const DEMO_BADGE_TOOLTIP =
  'This experience uses sample data. No real calls, messages, accounts, or AI services are connected.'

export const CALL_SCENARIO = {
  callerName: 'Bank Security Department',
  callerNumber: 'Unknown Caller',
  screeningLabel: 'CallGuard is screening this call',
  recipientName: 'Robert',
  familyMemberName: 'Sarah',
  highRiskTitle: 'High scam risk detected',
  highRiskBody: 'Do not share verification codes, passwords, or payment information.',
} as const

export const SCREENING_STEPS: ScreeningStep[] = [
  { id: 'connected', label: 'Call connected' },
  { id: 'monitoring', label: 'CallGuard monitoring begins' },
  { id: 'speech', label: 'Speech analysis begins' },
  { id: 'suspicious', label: 'Suspicious language is detected' },
  { id: 'riskUp', label: 'Risk level increases' },
]

/** Scripted conversation — never sent to an AI model */
export const TRANSCRIPT_LINES: TranscriptLine[] = [
  {
    id: 't1',
    speaker: 'caller',
    text: 'This is the security department. We detected suspicious activity on your bank account.',
    riskAfter: 'low',
  },
  {
    id: 't2',
    speaker: 'recipient',
    text: 'What do I need to do?',
    riskAfter: 'low',
  },
  {
    id: 't3',
    speaker: 'caller',
    text: 'To stop the transaction, read me the verification code we just sent to your phone.',
    riskAfter: 'suspicious',
  },
  {
    id: 't4',
    speaker: 'callguard',
    text: 'Warning: A legitimate bank should not ask you to share a one-time verification code.',
    riskAfter: 'suspicious',
  },
  {
    id: 't5',
    speaker: 'caller',
    text: 'You must act immediately or your account will be frozen.',
    riskAfter: 'high',
  },
  {
    id: 't6',
    speaker: 'callguard',
    text: 'High-pressure language detected. Scam risk has increased.',
    riskAfter: 'high',
  },
]

export const WARNING_SIGNALS: WarningSignal[] = [
  { id: 'otp', label: 'Request for a verification code' },
  { id: 'threat', label: 'Urgent threat' },
  { id: 'unknown', label: 'Unknown caller' },
  { id: 'bank', label: 'Claimed financial institution' },
  { id: 'pressure', label: 'Pressure to act immediately' },
]

export const PROTECTIVE_ACTIONS: ProtectiveActionDef[] = [
  {
    id: 'endCall',
    label: 'End Call',
    activeLabel: 'Call ended safely',
    resultMessage: 'Call ended safely.',
  },
  {
    id: 'blockCaller',
    label: 'Block Caller',
    activeLabel: 'Caller blocked',
    resultMessage: 'Caller blocked.',
  },
  {
    id: 'notifyFamily',
    label: 'Notify Family',
    activeLabel: 'Sarah was notified',
    resultMessage: 'Sarah was notified.',
  },
  {
    id: 'reportScam',
    label: 'Report Scam',
    activeLabel: 'Report saved',
    resultMessage: 'Report saved to your security history.',
  },
  {
    id: 'markSafe',
    label: 'Mark as Safe',
    activeLabel: 'Marked as safe',
    resultMessage: 'Risk lowered for this demo session only.',
    requiresConfirm: true,
    confirmTitle: 'Mark this call as safe?',
    confirmBody:
      'Only mark a call as safe if you are certain it is legitimate. Lowering the risk score is for demonstration purposes and does not contact anyone.',
  },
]

export const FAMILY_ALERT = {
  title: 'CallGuard Alert',
  body: 'Robert may be receiving a suspicious call from an unknown number claiming to represent a bank.',
  riskLevel: 'High' as const,
  reason: 'Verification-code request and urgent pressure language detected during screening.',
  acknowledgment: 'Sarah acknowledged this alert.',
} as const

export const SAFETY_SUMMARY = {
  title: 'Safety Summary',
  bullets: [
    'Unknown caller claimed to be a bank security department.',
    'Caller asked for a one-time verification code.',
    'High-pressure language threatened account freezes.',
    'CallGuard raised the risk level and offered protective actions.',
    'A trusted family member (Sarah) could be notified instantly.',
  ],
} as const

export const CALLGUARD_STATS = {
  callsScreened: '12',
  suspiciousDetected: '3',
  blockedCallers: '2',
  recentActivity: [
    { time: 'Today, 10:14 AM', detail: 'Unknown “Bank Security” — high risk (demo)' },
    { time: 'Yesterday', detail: 'Pharmacy refill reminder — low risk' },
    { time: 'Mon', detail: 'Blocked: “IRS Collections” spoof' },
  ],
} as const

export const DEMO_MODULES: DemoModule[] = [
  {
    id: 'callguard',
    title: 'CallGuard',
    summary: 'Live coaching during suspicious calls.',
    stats: [
      { label: 'Calls screened this week', value: CALLGUARD_STATS.callsScreened },
      { label: 'Suspicious calls detected', value: CALLGUARD_STATS.suspiciousDetected },
      { label: 'Blocked callers', value: CALLGUARD_STATS.blockedCallers },
    ],
    explanation:
      'CallGuard listens for scam patterns during a call and shows plain-language warnings so you can hang up safely.',
    exampleTitle: 'Recent call activity',
    exampleBody: CALLGUARD_STATS.recentActivity.map((a) => `${a.time}: ${a.detail}`).join('\n'),
    actionLabel: 'Replay call scenario',
    actionResult: 'Returning to the simulated call scenario…',
  },
  {
    id: 'inboxguard',
    title: 'InboxGuard',
    summary: 'Analyze messages and links for phishing.',
    stats: [
      { label: 'Suspicious emails detected', value: '5' },
      { label: 'Phishing warnings', value: '2' },
    ],
    explanation:
      'InboxGuard flags urgent “verify your account” messages and unsafe links before you respond.',
    exampleTitle: 'Flagged email (sample)',
    exampleBody:
      'From: security-alert@bank-secure-login.example\nSubject: Urgent: Confirm your account or it will be locked\nWhy flagged: Unknown sender domain + urgency + unexpected link.',
    actionLabel: 'Mark as phishing (simulated)',
    actionResult: 'Sample email marked as phishing in this demo session.',
  },
  {
    id: 'moneyguard',
    title: 'MoneyGuard',
    summary: 'Assess payment risk before you send money.',
    stats: [
      { label: 'Unusual payment warnings', value: '1' },
      { label: 'Recent scam alerts', value: '2' },
    ],
    explanation:
      'MoneyGuard helps you pause before sending money to someone pressuring you.',
    exampleTitle: 'Unusual payment request (sample)',
    exampleBody:
      'Someone asked Robert to buy gift cards and share the codes “to fix his computer.” MoneyGuard would warn that gift-card payments are a common scam tactic.',
    actionLabel: 'Review warning (simulated)',
    actionResult: 'Payment warning reviewed. No money was moved.',
    disclaimer:
      'Titanium Guardian does not move or control money. MoneyGuard only provides risk guidance.',
  },
  {
    id: 'identitywatch',
    title: 'IdentityWatch',
    summary: 'Monitor identity signals and escalate when needed.',
    stats: [
      { label: 'Exposure status', value: 'Watching' },
      { label: 'Open alerts', value: '1' },
    ],
    explanation:
      'IdentityWatch watches for signs your personal details may have appeared in a known breach and suggests next steps.',
    exampleTitle: 'Breach-monitoring alert (sample)',
    exampleBody:
      'An email address similar to Robert’s appeared in a public breach list. Recommended action: change passwords on important accounts and enable two-factor authentication.',
    actionLabel: 'Acknowledge alert (simulated)',
    actionResult: 'Identity alert acknowledged for this demo session.',
  },
  {
    id: 'webguardian',
    title: 'WebGuardian',
    summary: 'Protect against malicious websites and fraudulent links.',
    stats: [
      { label: 'Safe browsing status', value: 'Protected' },
      { label: 'Dangerous links blocked', value: '4' },
    ],
    explanation:
      'WebGuardian warns when a link looks like a fake login page or known scam site.',
    exampleTitle: 'Suspicious website warning (sample)',
    exampleBody:
      'Link: https://secure-bank-login-verify.example/reset\nWhy flagged: Domain does not match the real bank and asks for passwords immediately.',
    actionLabel: 'Block link (simulated)',
    actionResult: 'Sample link blocked in this demo session.',
  },
  {
    id: 'carecircle',
    title: 'CareCircle',
    summary: 'Trusted family support and shared safety alerts.',
    stats: [
      { label: 'Trusted contacts', value: '2' },
      { label: 'Recent family alerts', value: '1' },
    ],
    explanation:
      'CareCircle lets older adults share alerts with people they trust—without giving those contacts full account control.',
    exampleTitle: 'Trusted contacts (sample)',
    exampleBody:
      'Sarah (daughter) — SMS + app alerts\nMichael (son) — app alerts only\nPreference: Notify on high-risk calls and money warnings.',
    actionLabel: 'Send test alert (simulated)',
    actionResult: 'Test alert sent to Sarah in this demo session only.',
  },
]

export const TOUR_STEPS = [
  {
    id: 'tour-1',
    title: 'Incoming calls are screened',
    body: 'CallGuard reviews unknown callers before you share sensitive information.',
  },
  {
    id: 'tour-2',
    title: 'Suspicious behavior is identified',
    body: 'Scripted analysis looks for pressure tactics, bank impersonation, and code requests.',
  },
  {
    id: 'tour-3',
    title: 'You get a plain-language warning',
    body: 'Warnings avoid technical jargon so decisions stay clear under stress.',
  },
  {
    id: 'tour-4',
    title: 'Protective actions are ready',
    body: 'End the call, block the number, notify family, or report the scam in one place.',
  },
  {
    id: 'tour-5',
    title: 'Family can be alerted',
    body: 'Trusted contacts like Sarah receive a CareCircle-style safety notice.',
  },
  {
    id: 'tour-6',
    title: 'Everything lives in one dashboard',
    body: 'CallGuard, InboxGuard, MoneyGuard, IdentityWatch, WebGuardian, and CareCircle work together.',
  },
] as const

export const SPEAKER_LABELS: Record<TranscriptSpeaker, string> = {
  caller: 'Caller',
  recipient: 'Call recipient',
  callguard: 'CallGuard',
}
