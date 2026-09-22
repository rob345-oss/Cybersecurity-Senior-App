import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DialPad from '../DialPad'

describe('DialPad', () => {
  it('appends digits and calls onCall', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onCall = vi.fn()

    const { rerender } = render(
      <DialPad value="" onChange={onChange} onCall={onCall} />
    )

    await user.click(screen.getByRole('button', { name: 'Dial 5' }))
    expect(onChange).toHaveBeenCalledWith('5')

    rerender(<DialPad value="555" onChange={onChange} onCall={onCall} />)
    await user.click(screen.getByRole('button', { name: 'Call' }))
    expect(onCall).toHaveBeenCalled()
  })

  it('disables call when empty', () => {
    render(<DialPad value="" onChange={() => {}} onCall={() => {}} />)
    expect(screen.getByRole('button', { name: 'Call' })).toBeDisabled()
  })

  it('renders large touch targets for digits', () => {
    render(<DialPad value="1" onChange={() => {}} onCall={() => {}} />)
    const key = screen.getByRole('button', { name: 'Dial 1' })
    expect(key.className).toMatch(/min-h-\[64px\]/)
  })
})
