import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import VerificationRequestCard from '../VerificationRequestCard'
import type { VerificationRequest } from '../../../types/verification'

const baseRequest: VerificationRequest = {
  id: 'req-1',
  user_id: 'user-1',
  trusted_contact_id: 'tc-1',
  interaction_type: 'call',
  description: 'Someone asked me for gift cards.',
  risk_score: 85,
  risk_level: 'critical',
  risk_reasons: ['Requests payment with gift cards'],
  status: 'pending',
  created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  submitter_name: 'Alice',
  is_stale: true,
}

describe('VerificationRequestCard', () => {
  it('shows request summary and status', () => {
    render(<VerificationRequestCard request={baseRequest} />)
    expect(screen.getByText(/Someone asked me for gift cards/i)).toBeInTheDocument()
    expect(screen.getByText(/Waiting for review/i)).toBeInTheDocument()
    expect(screen.getByText(/Alice/i)).toBeInTheDocument()
  })

  it('highlights stale pending requests', () => {
    render(<VerificationRequestCard request={baseRequest} />)
    expect(screen.getByText(/Waiting over 30 minutes/i)).toBeInTheDocument()
  })
})
