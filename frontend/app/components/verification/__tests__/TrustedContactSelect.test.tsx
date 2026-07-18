import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TrustedContactSelect from '../TrustedContactSelect'
import type { TrustedContact } from '../../../types/verification'

const contacts: TrustedContact[] = [
  {
    id: 'tc-1',
    user_id: 'u-1',
    contact_user_id: 'u-2',
    contact_email: 'daughter@example.com',
    contact_name: 'Sam',
    label: 'Daughter',
    created_at: new Date().toISOString(),
  },
]

describe('TrustedContactSelect', () => {
  it('prompts to add a contact when none exist', () => {
    render(<TrustedContactSelect contacts={[]} value="" onChange={() => undefined} />)
    expect(screen.getByText(/add a trusted family member/i)).toBeInTheDocument()
  })

  it('lets the user choose a trusted contact', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TrustedContactSelect contacts={contacts} value="" onChange={onChange} />)
    await user.selectOptions(screen.getByLabelText(/Who should review this/i), 'tc-1')
    expect(onChange).toHaveBeenCalledWith('tc-1')
  })
})
