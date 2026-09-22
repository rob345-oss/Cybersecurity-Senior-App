import { describe, it, expect } from 'vitest'
import { demoReducer, initialDemoState } from '../demoState'
import { SCREENING_STEPS, TRANSCRIPT_LINES } from '../demoData'

describe('demoReducer', () => {
  it('starts at welcome and starts the call scenario', () => {
    const state = demoReducer(initialDemoState(), { type: 'START_DEMO' })
    expect(state.stage).toBe('incoming')
    expect(state.riskLevel).toBe('low')
  })

  it('answers the call and enters screening', () => {
    let state = demoReducer(initialDemoState(), { type: 'START_DEMO' })
    state = demoReducer(state, { type: 'ANSWER_CALL' })
    expect(state.stage).toBe('screening')
    expect(state.screeningStepIndex).toBe(0)
  })

  it('declines the call and goes to dashboard without API side effects', () => {
    let state = demoReducer(initialDemoState(), { type: 'START_DEMO' })
    state = demoReducer(state, { type: 'DECLINE_CALL' })
    expect(state.stage).toBe('dashboard')
    expect(state.declinedCall).toBe(true)
  })

  it('progresses risk through transcript reveals', () => {
    let state = demoReducer(initialDemoState(), { type: 'START_DEMO' })
    state = demoReducer(state, { type: 'ANSWER_CALL' })
    state = demoReducer(state, { type: 'SET_SCREENING_STEP', index: SCREENING_STEPS.length - 1 })
    expect(state.stage).toBe('screening')
    state = demoReducer(state, { type: 'SET_SCREENING_STEP', index: SCREENING_STEPS.length })
    expect(state.stage).toBe('suspicious')
    expect(state.riskLevel).toBe('suspicious')

    // Early transcript lines must not lower an escalated risk level
    state = demoReducer(state, { type: 'REVEAL_TRANSCRIPT_LINE', index: 0 })
    expect(state.riskLevel).toBe('suspicious')
    state = demoReducer(state, { type: 'REVEAL_TRANSCRIPT_LINE', index: 1 })
    expect(state.riskLevel).toBe('suspicious')

    const highIndex = TRANSCRIPT_LINES.findIndex((l) => l.riskAfter === 'high')
    state = demoReducer(state, { type: 'REVEAL_TRANSCRIPT_LINE', index: highIndex })
    expect(state.riskLevel).toBe('high')
    expect(state.stage).toBe('highRisk')
  })

  it('applies protective actions locally', () => {
    let state = demoReducer(initialDemoState(), { type: 'ENTER_PROTECTIVE' })
    state = demoReducer(state, {
      type: 'APPLY_PROTECTIVE',
      id: 'blockCaller',
      message: 'Caller blocked.',
    })
    expect(state.protectiveResults.blockCaller).toBe('Caller blocked.')
    state = demoReducer(state, {
      type: 'APPLY_PROTECTIVE',
      id: 'notifyFamily',
      message: 'Sarah was notified.',
    })
    expect(state.protectiveResults.notifyFamily).toBe('Sarah was notified.')
  })

  it('requires confirmation before marking safe and lowers risk', () => {
    let state = demoReducer(initialDemoState(), { type: 'ENTER_PROTECTIVE' })
    state = { ...state, riskLevel: 'high' }
    state = demoReducer(state, { type: 'REQUEST_MARK_SAFE_CONFIRM' })
    expect(state.showMarkSafeConfirm).toBe(true)
    state = demoReducer(state, {
      type: 'CONFIRM_MARK_SAFE',
      message: 'Risk lowered for this demo session only.',
    })
    expect(state.riskLevel).toBe('low')
    expect(state.showMarkSafeConfirm).toBe(false)
  })

  it('restarts to a clean welcome state', () => {
    let state = demoReducer(initialDemoState(), { type: 'START_DEMO' })
    state = demoReducer(state, { type: 'ANSWER_CALL' })
    state = demoReducer(state, {
      type: 'APPLY_PROTECTIVE',
      id: 'endCall',
      message: 'Call ended safely.',
    })
    state = demoReducer(state, { type: 'RESTART' })
    expect(state.stage).toBe('welcome')
    expect(state.protectiveResults).toEqual({})
    expect(state.transcriptIndex).toBe(-1)
    expect(state.riskLevel).toBe('low')
  })

  it('opens dashboard exploration from welcome', () => {
    const state = demoReducer(initialDemoState(), { type: 'EXPLORE_DASHBOARD' })
    expect(state.stage).toBe('dashboard')
  })
})
