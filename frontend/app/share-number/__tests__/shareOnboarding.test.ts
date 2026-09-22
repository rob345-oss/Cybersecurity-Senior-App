import { describe, it, expect } from 'vitest'
import {
  validatePhone,
  normalizePhone,
  formatPhoneForDisplay,
  phoneForSmsUri,
} from '@/app/utils/phone'
import {
  buildPersonalizedMessage,
  resolveMessage,
} from '@/app/utils/messageTemplates'
import { buildSmsUrl } from '@/app/utils/shareActions'

describe('phone utils', () => {
  it('validates US numbers', () => {
    expect(validatePhone('5551234567')).toBe(true)
    expect(validatePhone('(555) 123-4567')).toBe(true)
  })

  it('validates international numbers', () => {
    expect(validatePhone('+44 7911 123456')).toBe(true)
  })

  it('normalizes with plus prefix', () => {
    expect(normalizePhone('+1 (555) 123-4567')).toBe('+15551234567')
  })

  it('formats for display', () => {
    const formatted = formatPhoneForDisplay('+15551234567')
    expect(formatted).toContain('555')
  })

  it('prepares sms uri phone', () => {
    expect(phoneForSmsUri('(555) 123-4567')).toBe('5551234567')
  })
})

describe('messageTemplates', () => {
  it('personalizes default template', () => {
    const message = buildPersonalizedMessage({
      userFirstName: 'Alex',
      contactFirstName: 'Jamie',
      protectedNumber: '+1 (555) 123-4567',
      template: 'default',
    })
    expect(message).toContain('Jamie')
    expect(message).toContain('Alex')
    expect(message).toContain('Titanium Guardian')
  })

  it('uses custom text when provided', () => {
    const message = resolveMessage({
      userFirstName: 'Alex',
      contactFirstName: 'Jamie',
      protectedNumber: '+1 555 123 4567',
      template: 'default',
      customText: 'Custom hello',
    })
    expect(message).toBe('Custom hello')
  })
})

describe('shareActions SMS encoding', () => {
  it('URL-encodes message body', () => {
    const url = buildSmsUrl('5551234567', 'Hi Jamie—it\'s Alex & friends')
    expect(url.startsWith('sms:5551234567?body=')).toBe(true)
    expect(url).toContain(encodeURIComponent('Hi Jamie—it\'s Alex & friends'))
  })

  it('encodes spaces and special characters', () => {
    const url = buildSmsUrl('+15551234567', 'Hello world & more')
    expect(url).toContain(encodeURIComponent('Hello world & more'))
  })
})
