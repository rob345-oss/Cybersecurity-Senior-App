import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReviewActionButtons from '../ReviewActionButtons'

describe('ReviewActionButtons', () => {
  it('renders all four review actions', () => {
    render(<ReviewActionButtons onSelect={() => undefined} />)
    expect(screen.getByRole('button', { name: /Likely Safe/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Suspicious/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirmed Scam/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Call Me Now \/ Needs Discussion/i })
    ).toBeInTheDocument()
  })

  it('calls onSelect with the chosen status', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ReviewActionButtons onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: /Confirmed Scam/i }))
    expect(onSelect).toHaveBeenCalledWith('confirmed_scam')
  })
})
