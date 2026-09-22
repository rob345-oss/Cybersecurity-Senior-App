import { fetchWithAuth, getAuthHeaders, getErrorMessage } from '../utils/auth'

const apiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Contact {
  id: string
  display_name: string
  first_name?: string | null
  last_name?: string | null
  primary_phone?: string | null
  normalized_phone?: string | null
  additional_phone_numbers: Array<{ raw?: string; normalized?: string }>
  email?: string | null
  photo_url?: string | null
  source: string
  is_trusted: boolean
  relationship?: string | null
  source_contact_deleted: boolean
  last_synced_at?: string | null
  created_at?: string | null
}

export interface ContactsStatus {
  status: string
  connected: boolean
  account_email?: string | null
  last_synced_at?: string | null
  contact_count: number
  trusted_count: number
}

export interface ContactsListResponse {
  contacts: Contact[]
  total: number
  page: number
  page_size: number
  google_status?: string | null
  last_synced_at?: string | null
  trusted_count: number
}

export interface DuplicatePair {
  id: string
  reason: string
  contact_a: Partial<Contact> & { id: string; display_name: string }
  contact_b: Partial<Contact> & { id: string; display_name: string }
}

async function parseJson<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(getErrorMessage((data as { detail?: unknown }).detail, fallback))
  }
  return data as T
}

export async function getContactsStatus(): Promise<ContactsStatus> {
  const res = await fetchWithAuth('/v1/contacts/status')
  return parseJson(res, 'We couldn’t load your contacts status. Please try again.')
}

export async function listContacts(params: {
  q?: string
  relationship?: string
  trusted_only?: boolean
  page?: number
  page_size?: number
}): Promise<ContactsListResponse> {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.relationship) search.set('relationship', params.relationship)
  if (params.trusted_only) search.set('trusted_only', 'true')
  search.set('page', String(params.page ?? 1))
  search.set('page_size', String(params.page_size ?? 50))
  const res = await fetchWithAuth(`/v1/contacts?${search.toString()}`)
  return parseJson(res, 'We couldn’t load your contacts. Please try again.')
}

export async function startGoogleConnect(): Promise<{ authorize_url: string }> {
  const res = await fetchWithAuth('/v1/contacts/google/connect')
  return parseJson(res, 'We couldn’t start the Google connection. Please try again.')
}

export async function syncGoogleContacts(): Promise<{ message: string; last_synced_at?: string }> {
  const res = await fetchWithAuth('/v1/contacts/google/sync', { method: 'POST' })
  return parseJson(res, 'We couldn’t update your contacts. Your existing trusted callers are still protected. Try again.')
}

export async function disconnectGoogle(): Promise<{ message: string }> {
  const res = await fetchWithAuth('/v1/contacts/google', { method: 'DELETE' })
  return parseJson(res, 'We couldn’t disconnect Google Contacts. Please try again.')
}

export async function deleteContactData(payload: {
  confirm: boolean
  remove_trusted_callers: boolean
}): Promise<{ message: string; details?: Record<string, unknown> }> {
  const res = await fetchWithAuth('/v1/contacts/data', {
    method: 'DELETE',
    body: JSON.stringify(payload),
  })
  return parseJson(res, 'We couldn’t delete contact data. Please try again.')
}

export async function trustContact(
  contactId: string,
  body: { relationship?: string; notes?: string } = {}
): Promise<{ message: string }> {
  const res = await fetchWithAuth(`/v1/contacts/${contactId}/trust`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseJson(res, 'We couldn’t update Trusted Callers. Please try again.')
}

export async function untrustContact(contactId: string): Promise<{ message: string }> {
  const res = await fetchWithAuth(`/v1/contacts/${contactId}/trust`, { method: 'DELETE' })
  return parseJson(res, 'We couldn’t update Trusted Callers. Please try again.')
}

export async function bulkTrust(payload: {
  contact_ids: string[]
  action: 'add' | 'remove'
  relationship?: string
}): Promise<{ message: string; count: number }> {
  const res = await fetchWithAuth('/v1/contacts/trust/bulk', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return parseJson(res, 'We couldn’t update Trusted Callers. Please try again.')
}

export async function addManualTrusted(payload: {
  name: string
  phone: string
  relationship?: string
  notes?: string
}): Promise<{ message: string }> {
  const res = await fetchWithAuth('/v1/contacts/manual', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return parseJson(res, 'We couldn’t add that trusted caller. Please check the phone number.')
}

export async function updateContact(
  contactId: string,
  body: { relationship?: string; is_trusted?: boolean }
): Promise<Contact> {
  const res = await fetchWithAuth(`/v1/contacts/${contactId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return parseJson(res, 'We couldn’t update that contact. Please try again.')
}

export async function listDuplicates(): Promise<{ message: string; duplicates: DuplicatePair[] }> {
  const res = await fetchWithAuth('/v1/contacts/duplicates')
  return parseJson(res, 'We couldn’t check for duplicates. Please try again.')
}

export async function mergeDuplicate(
  suggestionId: string,
  keepContactId: string
): Promise<Contact> {
  const res = await fetchWithAuth(`/v1/contacts/duplicates/${suggestionId}/merge`, {
    method: 'POST',
    body: JSON.stringify({ keep_contact_id: keepContactId }),
  })
  return parseJson(res, 'We couldn’t merge those contacts. Please try again.')
}

export async function getRelationships(): Promise<string[]> {
  const res = await fetchWithAuth('/v1/contacts/relationships')
  const data = await parseJson<{ relationships: string[] }>(res, 'Could not load relationships.')
  return data.relationships
}

export async function importVcard(file: File, confirm: boolean): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append('file', file)
  const headers = getAuthHeaders()
  delete headers['Content-Type']
  const res = await fetch(
    `${apiUrl()}/v1/contacts/import/vcard?confirm=${confirm ? 'true' : 'false'}`,
    {
      method: 'POST',
      headers: { Authorization: headers.Authorization || '' },
      body: form,
    }
  )
  return parseJson(res, 'We couldn’t read that contacts file. Please export a .vcf file and try again.')
}

export const RELATIONSHIP_OPTIONS = [
  'Family',
  'Friend',
  'Caregiver',
  'Doctor / Healthcare',
  'Neighbor',
  'Business',
  'Emergency Contact',
  'Other',
]

export function formatLastSynced(iso?: string | null): string {
  if (!iso) return 'Not yet updated'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Not yet updated'
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today at ${time}`
  return `${date.toLocaleDateString()} at ${time}`
}

export function contactInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
