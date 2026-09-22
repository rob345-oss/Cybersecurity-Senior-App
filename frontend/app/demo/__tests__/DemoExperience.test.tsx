import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DemoExperience from '../DemoExperience'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

async function startAndAnswer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^start demo$/i }))
  await user.click(screen.getByRole('button', { name: /^answer$/i }))
}

async function advanceToProtective(user: ReturnType<typeof userEvent.setup>) {
  await vi.runAllTimersAsync()
  const continueBtn = screen.queryByRole('button', {
    name: /continue to protective actions/i,
  })
  if (continueBtn) {
    await user.click(continueBtn)
  }
  await vi.runAllTimersAsync()
}

describe('DemoExperience', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('shows welcome screen with disclosures and start controls', () => {
    render(<DemoExperience />)
    expect(
      screen.getByRole('heading', { name: /see titanium guardian in action/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/simulated experience/i)).toBeInTheDocument()
    expect(screen.getByText(/no real calls or personal data/i)).toBeInTheDocument()
    expect(screen.getByText(/no signup required/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^start demo$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /explore dashboard/i })).toBeInTheDocument()
    expect(screen.getByText(/simulated demo/i)).toBeInTheDocument()
  })

  it('exits via Exit Demo link to home', () => {
    render(<DemoExperience />)
    const exit = screen.getByRole('link', { name: /exit demo/i })
    expect(exit).toHaveAttribute('href', '/')
  })

  it('starts the scenario and answers the incoming call', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DemoExperience />)

    await startAndAnswer(user)
    expect(screen.getByText(/bank security department/i)).toBeInTheDocument()
    expect(screen.getAllByText(/call connected/i).length).toBeGreaterThan(0)
  })

  it('runs protective actions locally without calling fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DemoExperience />)

    await startAndAnswer(user)
    await advanceToProtective(user)

    const endCall = await screen.findByRole('button', { name: /^end call$/i })
    await user.click(endCall)
    expect(screen.getByRole('button', { name: /call ended safely/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^block caller$/i }))
    expect(screen.getByRole('button', { name: /caller blocked/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^notify family$/i }))
    expect(screen.getByRole('button', { name: /sarah was notified/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^report scam$/i }))
    expect(screen.getByRole('button', { name: /report saved/i })).toBeInTheDocument()

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('supports mark as safe confirmation and restart', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DemoExperience />)

    await startAndAnswer(user)
    await advanceToProtective(user)

    await user.click(await screen.findByRole('button', { name: /^mark as safe$/i }))
    expect(screen.getByRole('dialog', { name: /mark this call as safe/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /yes, mark as safe/i }))
    expect(screen.getByRole('button', { name: /marked as safe/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /restart demo/i }))
    expect(
      screen.getByRole('heading', { name: /see titanium guardian in action/i })
    ).toBeInTheDocument()
  })

  it('explores the dashboard modules with keyboard activation', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(<DemoExperience />)

    await user.click(screen.getByRole('button', { name: /explore dashboard/i }))
    expect(screen.getByRole('heading', { name: /protection dashboard/i })).toBeInTheDocument()

    const callGuardCard = screen.getByRole('button', { name: /callguard/i })
    callGuardCard.focus()
    expect(callGuardCard).toHaveFocus()
    await user.keyboard('{Enter}')

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/how it works/i)).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('toggles transcript from the call screen', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<DemoExperience />)
    await user.click(screen.getByRole('button', { name: /^start demo$/i }))
    await user.click(screen.getByRole('button', { name: /turn transcript off/i }))
    expect(screen.getByRole('button', { name: /turn transcript on/i })).toBeInTheDocument()
  })
})
