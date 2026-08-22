import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProtectedNumberCard from '@/app/components/share-number/ProtectedNumberCard'

describe('ProtectedNumberCard', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('displays formatted number', () => {
    render(<ProtectedNumberCard formattedNumber="+1 (555) 123-4567" rawNumber="+15551234567" />)
    expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument()
  })

  it('copies number on button click', async () => {
    render(<ProtectedNumberCard formattedNumber="+1 (555) 123-4567" rawNumber="+15551234567" />)
    fireEvent.click(screen.getByRole('button', { name: /copy protected phone number/i }))
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('+15551234567')
    })
    expect(screen.getByText(/number copied/i)).toBeInTheDocument()
  })

  it('has accessible copy button label', () => {
    render(<ProtectedNumberCard formattedNumber="+1 (555) 123-4567" />)
    expect(screen.getByRole('button', { name: /copy protected phone number/i })).toBeInTheDocument()
  })
})

describe('TrustedContactForm validation', () => {
  it('is tested via validateContactForm export', async () => {
    const { validateContactForm } = await import('@/app/components/share-number/TrustedContactForm')
    const errors = validateContactForm({ first_name: '', phone: '123', relationship: '' })
    expect(errors.first_name).toBeTruthy()
    expect(errors.phone).toBeTruthy()
  })
})

describe('shareActions copy fallback', () => {
  it('returns copy fallback when web share unavailable', async () => {
    const { shareAnotherWay } = await import('@/app/utils/shareActions')
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      share: undefined,
    })
    const result = await shareAnotherWay('Test message')
    expect(result.method).toBe('copy')
    expect(result.success).toBe(true)
    expect(result.userMessage.toLowerCase()).toContain('clipboard')
  })
})

describe('SMS link does not auto-send', () => {
  it('openSmsLink sets sms href via assignment', async () => {
    const { openSmsLink } = await import('@/app/utils/shareActions')
    let assignedHref = ''
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        set href(value: string) {
          assignedHref = value
        },
        get href() {
          return assignedHref || 'http://localhost:3000/'
        },
      },
    })
    const result = openSmsLink('5551234567', 'Hello')
    expect(result.method).toBe('sms')
    expect(result.userMessage.toLowerCase()).toContain('nothing is sent')
    expect(assignedHref).toContain('sms:5551234567')
    expect(assignedHref).toContain(encodeURIComponent('Hello'))
  })
})
