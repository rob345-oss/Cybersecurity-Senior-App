import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SafetyWarning from '../SafetyWarning'
import { HIGH_RISK_WARNING } from '../../../types/verification'

describe('SafetyWarning', () => {
  it('shows the high-risk safety warning copy', () => {
    render(<SafetyWarning />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/Important safety warning/i)).toBeInTheDocument()
    expect(screen.getByText(HIGH_RISK_WARNING)).toBeInTheDocument()
  })
})
