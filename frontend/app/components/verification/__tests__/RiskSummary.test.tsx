import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RiskSummary from '../RiskSummary'
import { HIGH_RISK_WARNING } from '../../../types/verification'

describe('RiskSummary', () => {
  it('renders score, level, and reasons', () => {
    render(
      <RiskSummary
        riskScore={80}
        riskLevel="critical"
        riskReasons={['Requests payment with gift cards']}
      />
    )
    expect(screen.getByText(/critical/i)).toBeInTheDocument()
    expect(screen.getByText(/80\/100/)).toBeInTheDocument()
    expect(screen.getByText(/Requests payment with gift cards/i)).toBeInTheDocument()
  })

  it('shows safety warning for high and critical risk', () => {
    render(
      <RiskSummary
        riskScore={70}
        riskLevel="high"
        riskReasons={['Uses urgent or threatening language']}
      />
    )
    expect(screen.getByText(HIGH_RISK_WARNING)).toBeInTheDocument()
  })

  it('does not claim the interaction is definitely fraudulent', () => {
    render(
      <RiskSummary
        riskScore={90}
        riskLevel="critical"
        riskReasons={['Requests cryptocurrency payment']}
      />
    )
    expect(screen.queryByText(/definitely/i)).not.toBeInTheDocument()
    expect(screen.getByText(/trusted contact still needs to confirm/i)).toBeInTheDocument()
  })
})
