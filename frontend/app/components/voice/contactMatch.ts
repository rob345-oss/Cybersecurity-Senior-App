import { normalizePhone } from '../../utils/phone'
import type { Contact } from '../../contacts/api'
import type { CallerDisplay, TrustedCallerInfo } from './types'

function digitsOnly(phone: string): string {
  return normalizePhone(phone).replace(/\D/g, '')
}

function phonesMatch(a: string, b: string): boolean {
  const da = digitsOnly(a)
  const db = digitsOnly(b)
  if (!da || !db) return false
  if (da === db) return true
  // Match last 10 digits for US-style numbers
  if (da.length >= 10 && db.length >= 10) {
    return da.slice(-10) === db.slice(-10)
  }
  return false
}

export function findContactByPhone(
  contacts: Contact[],
  phone: string
): Contact | null {
  if (!phone.trim()) return null
  for (const contact of contacts) {
    if (contact.primary_phone && phonesMatch(contact.primary_phone, phone)) {
      return contact
    }
    if (contact.normalized_phone && phonesMatch(contact.normalized_phone, phone)) {
      return contact
    }
    for (const extra of contact.additional_phone_numbers || []) {
      const candidate = extra.normalized || extra.raw
      if (candidate && phonesMatch(candidate, phone)) return contact
    }
  }
  return null
}

export function contactToCallerDisplay(
  phone: string,
  contact: Contact | null
): CallerDisplay {
  if (!contact) {
    return {
      phoneNumber: phone,
      displayName: phone.trim() || 'Unknown',
      isTrusted: false,
    }
  }
  return {
    phoneNumber: phone,
    displayName: contact.display_name || phone,
    photoUrl: contact.photo_url,
    relationship: contact.relationship,
    isTrusted: contact.is_trusted,
    contactId: contact.id,
  }
}

export function trustedInfoFromContact(contact: Contact | null): TrustedCallerInfo | null {
  if (!contact) return null
  return {
    trusted: contact.is_trusted,
    contact_id: contact.id,
    name: contact.display_name,
    relationship: contact.relationship,
    source: contact.source,
    normalized_phone: contact.normalized_phone,
    photo_url: contact.photo_url,
  }
}

export function callerDisplayFromTrusted(
  phone: string,
  trusted: TrustedCallerInfo | null,
  fallbackName?: string
): CallerDisplay {
  const displayName = trusted?.name || fallbackName || phone || 'Unknown'
  if (trusted?.trusted) {
    return {
      phoneNumber: phone,
      displayName,
      photoUrl: trusted.photo_url,
      relationship: trusted.relationship,
      isTrusted: true,
      contactId: trusted.contact_id,
    }
  }
  // A saved contact who is not trusted still has a name. Dropping it made
  // known callers look like raw numbers on the incoming-call screen.
  return {
    phoneNumber: phone,
    displayName,
    photoUrl: trusted?.photo_url,
    relationship: trusted?.relationship,
    isTrusted: false,
    contactId: trusted?.contact_id,
  }
}
