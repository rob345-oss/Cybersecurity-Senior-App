'use client'

import type { TrustedContact } from '../../types/verification'

interface TrustedContactSelectProps {
  contacts: TrustedContact[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function contactLabel(contact: TrustedContact): string {
  if (contact.label?.trim()) return contact.label.trim()
  if (contact.contact_name?.trim()) return contact.contact_name.trim()
  if (contact.contact_email) return contact.contact_email
  return 'Trusted contact'
}

export default function TrustedContactSelect({
  contacts,
  value,
  onChange,
  disabled,
}: TrustedContactSelectProps) {
  if (contacts.length === 0) {
    return (
      <div className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-4 text-lg text-amber-950">
        You need to add a trusted family member or caregiver first. Open CareCircle to add
        someone by their email address.
      </div>
    )
  }

  return (
    <div>
      <label htmlFor="trusted-contact" className="block text-xl font-semibold text-gray-900 mb-2">
        Who should review this?
      </label>
      <select
        id="trusted-contact"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border-2 border-gray-400 bg-white px-4 py-4 text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
      >
        <option value="">Select a trusted contact</option>
        {contacts.map((contact) => (
          <option key={contact.id} value={contact.id}>
            {contactLabel(contact)}
            {contact.contact_email ? ` (${contact.contact_email})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
