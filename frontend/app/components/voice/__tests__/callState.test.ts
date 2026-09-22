import { describe, expect, it } from 'vitest'
import { deriveCallPhase, formatCallDuration } from '../callState'

describe('deriveCallPhase', () => {
  it('returns failed when callFailed', () => {
    expect(
      deriveCallPhase({
        deviceStatus: 'ready',
        hasActiveCall: false,
        isDialing: false,
        isConnecting: false,
        callFailed: true,
        justEnded: false,
      })
    ).toBe('failed')
  })

  it('returns active when on call', () => {
    expect(
      deriveCallPhase({
        deviceStatus: 'on-call',
        hasActiveCall: true,
        isDialing: false,
        isConnecting: false,
        callFailed: false,
        justEnded: false,
      })
    ).toBe('active')
  })

  it('returns dialing before connect', () => {
    expect(
      deriveCallPhase({
        deviceStatus: 'ready',
        hasActiveCall: false,
        isDialing: true,
        isConnecting: false,
        callFailed: false,
        justEnded: false,
      })
    ).toBe('dialing')
  })

  it('returns connecting while connecting', () => {
    expect(
      deriveCallPhase({
        deviceStatus: 'ready',
        hasActiveCall: false,
        isDialing: false,
        isConnecting: true,
        callFailed: false,
        justEnded: false,
      })
    ).toBe('connecting')
  })

  it('returns ended briefly after hangup', () => {
    expect(
      deriveCallPhase({
        deviceStatus: 'ready',
        hasActiveCall: false,
        isDialing: false,
        isConnecting: false,
        callFailed: false,
        justEnded: true,
      })
    ).toBe('ended')
  })

  it('returns idle by default', () => {
    expect(
      deriveCallPhase({
        deviceStatus: 'ready',
        hasActiveCall: false,
        isDialing: false,
        isConnecting: false,
        callFailed: false,
        justEnded: false,
      })
    ).toBe('idle')
  })
})

describe('formatCallDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatCallDuration(0)).toBe('0:00')
    expect(formatCallDuration(65)).toBe('1:05')
    expect(formatCallDuration(125)).toBe('2:05')
  })
})
