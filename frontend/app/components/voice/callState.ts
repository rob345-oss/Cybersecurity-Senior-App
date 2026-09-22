import type { DeviceStatus } from './useTwilioDevice'
import type { CallPhase } from './types'

export interface DeriveCallPhaseInput {
  deviceStatus: DeviceStatus
  hasActiveCall: boolean
  isDialing: boolean
  isConnecting: boolean
  callFailed: boolean
  justEnded: boolean
}

/**
 * Maps Twilio device status + local UI flags into a presentation CallPhase.
 * Keeps calling logic (DeviceStatus) separate from screen orchestration.
 */
export function deriveCallPhase(input: DeriveCallPhaseInput): CallPhase {
  // A live call wins over a leftover failed/ended flag from the previous attempt.
  if (input.hasActiveCall || input.deviceStatus === 'on-call') return 'active'
  if (input.callFailed) return 'failed'
  if (input.justEnded) return 'ended'
  if (input.isConnecting) return 'connecting'
  if (input.isDialing) return 'dialing'
  return 'idle'
}

export function formatCallDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
