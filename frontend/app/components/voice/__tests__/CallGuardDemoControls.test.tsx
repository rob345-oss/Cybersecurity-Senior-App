import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CallGuardDemoControls from '../CallGuardDemoControls'

describe('CallGuardDemoControls', () => {
  it('renders demo controls in development', () => {
    render(
      <CallGuardDemoControls scenario="off" onScenarioChange={vi.fn()} />
    )
    expect(screen.getByTestId('callguard-demo-controls')).toBeInTheDocument()
    expect(screen.getByText(/Demo mode/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /High risk/i })).toBeInTheDocument()
  })
})
