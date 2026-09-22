import { describe, expect, it } from 'vitest'
import {
  findContactByPhone,
  contactToCallerDisplay,
  callerDisplayFromTrusted,
} from '../contactMatch'
import type { Contact } from '../../../contacts/api'

const contact: Contact = {
  id: 'c1',
  display_name: 'Mary Smith',
  primary_phone: '+1 (301) 555-0192',
  normalized_phone: '+13015550192',
  additional_phone_numbers: [],
  source: 'manual',
  is_trusted: true,
  relationship: 'Daughter',
  source_contact_deleted: false,
  photo_url: null,
}

describe('contactMatch', () => {
  it('matches phone numbers by last 10 digits', () => {
    expect(findContactByPhone([contact], '3015550192')?.id).toBe('c1')
    expect(findContactByPhone([contact], '+13015550192')?.display_name).toBe('Mary Smith')
  })

  it('builds caller display from trusted contact', () => {
    const display = contactToCallerDisplay('+13015550192', contact)
    expect(display.isTrusted).toBe(true)
    expect(display.displayName).toBe('Mary Smith')
    expect(display.relationship).toBe('Daughter')
  })

  it('keeps the name of a saved contact who is not trusted', () => {
    const untrusted = { ...contact, is_trusted: false, display_name: 'Alex Rivera' }
    const display = contactToCallerDisplay('+13015550192', untrusted)
    expect(display.isTrusted).toBe(false)
    expect(display.displayName).toBe('Alex Rivera')

    const fromTrusted = callerDisplayFromTrusted('+13015550192', {
      trusted: false,
      name: 'Alex Rivera',
      contact_id: 'c1',
    })
    expect(fromTrusted.isTrusted).toBe(false)
    expect(fromTrusted.displayName).toBe('Alex Rivera')
  })

  it('falls back for unknown numbers', () => {
    const display = contactToCallerDisplay('+15550001111', null)
    expect(display.isTrusted).toBe(false)
    expect(display.displayName).toContain('555')
  })
})
