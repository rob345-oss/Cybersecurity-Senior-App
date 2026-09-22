/** Phone validation, normalization, and display formatting. */

export function normalizePhone(phone: string): string {
  const cleaned = phone.trim()
  const hasPlus = cleaned.startsWith('+')
  const digits = cleaned.replace(/\D/g, '')
  return hasPlus ? `+${digits}` : digits
}

export function validatePhone(phone: string): boolean {
  if (!phone?.trim()) return false
  if (!/^[\d\s\-+().]{10,25}$/.test(phone.trim())) return false
  const normalized = normalizePhone(phone)
  const digits = normalized.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizePhone(phone)
  if (normalized.startsWith('+1') && normalized.length === 12) {
    const digits = normalized.slice(2)
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (normalized.startsWith('+') && normalized.length > 4) {
    const countryLen = normalized.length > 11 ? 3 : 2
    const country = normalized.slice(0, countryLen)
    const rest = normalized.slice(countryLen)
    if (rest.length >= 6) {
      return `${country} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`
    }
    return `${country} ${rest}`
  }
  if (normalized.length === 10) {
    return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`
  }
  return normalized
}

export function phoneForSmsUri(phone: string): string {
  return normalizePhone(phone)
}

/**
 * E.164 for an outbound call.
 * A leading + is kept and formatting is stripped.
 * 10-digit and 1+10-digit numbers are treated as US, matching the dial pad.
 */
export function toOutboundE164(phone: string): string {
  const trimmed = phone.trim()
  if (!trimmed) return ''
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''
  if (hasPlus) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return `+${digits}`
}
