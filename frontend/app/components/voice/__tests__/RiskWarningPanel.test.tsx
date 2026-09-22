import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RiskWarningPanel from '../RiskWarningPanel'

describe('RiskWarningPanel', () => {
  it('renders trusted contact calmly', () => {
    render(<RiskWarningPanel state="trusted" />)
    expect(screen.getByRole('status')).toHaveTextContent(/Trusted contact/i)
    expect(screen.getByText(/trusted contacts/i)).toBeInTheDocument()
  })

  it('shows unknown actions', async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()
    const onGoBack = vi.fn()
    const onAddTrusted = vi.fn()

    render(
      <RiskWarningPanel
        state="unknown"
        onContinue={onContinue}
        onGoBack={onGoBack}
        onAddTrusted={onAddTrusted}
      />
    )

    expect(screen.getByText(/Unknown number/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Continue call/i }))
    expect(onContinue).toHaveBeenCalled()
  })

  it('requires confirmation before continuing high risk', async () => {
    const user = userEvent.setup()
    const onContinueAnyway = vi.fn()
    const onEndCall = vi.fn()

    render(
      <RiskWarningPanel
        state="highRisk"
        inCall
        warningSigns={['verification_code_request']}
        onContinueAnyway={onContinueAnyway}
        onEndCall={onEndCall}
        onAlertTrusted={() => {}}
        onReport={() => {}}
      />
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/High-risk scam warning/i)
    expect(screen.getByRole('button', { name: /End call/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Continue anyway$/i }))
    expect(onContinueAnyway).not.toHaveBeenCalled()
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Yes, continue anyway/i }))
    expect(onContinueAnyway).toHaveBeenCalled()
  })

  it('shows checklist for possible risk', () => {
    render(
      <RiskWarningPanel
        state="possibleRisk"
        onContinueAnyway={() => {}}
        onEndCall={() => {}}
        inCall
      />
    )
    expect(screen.getByText(/Never share verification codes/i)).toBeInTheDocument()
    expect(screen.getByText(/possible scam indicators/i)).toBeInTheDocument()
  })
})
