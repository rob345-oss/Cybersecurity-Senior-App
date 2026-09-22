import { fetchWithAuth, getErrorMessage } from '../utils/auth'
import type { MessageTemplateKey } from '../utils/messageTemplates'

export type SharingStatus =
  | 'not_started'
  | 'prepared'
  | 'share_opened'
  | 'user_confirmed_shared'

export interface ProtectedNumberInfo {
  protected_number: string
  protected_number_formatted: string
  activated_at?: string | null
  onboarding_completed_at?: string | null
  onboarding_deferred_at?: string | null
}

export interface ShareEventInfo {
  message_template: MessageTemplateKey
  custom_message?: string | null
  message_preview: string
  sharing_status: SharingStatus
  last_share_action_at?: string | null
}

export interface TrustedContactInfo {
  id: string
  first_name: string
  phone: string
  phone_formatted: string
  relationship?: string | null
  is_selected: boolean
  share_event?: ShareEventInfo | null
  created_at: string
  updated_at: string
}

export interface ShareOnboardingSummary {
  protected_number_formatted?: string | null
  total_contacts: number
  selected_contacts: number
  prepared_count: number
  share_opened_count: number
  user_confirmed_shared_count: number
  remaining_contacts: number
  onboarding_completed: boolean
  onboarding_deferred: boolean
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Request failed'
    try {
      const data = await response.json()
      message = getErrorMessage(data.detail, message)
    } catch {
      message = response.statusText || message
    }
    throw new Error(message)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return response.json()
}

export async function activateProtectedNumber(): Promise<ProtectedNumberInfo> {
  const response = await fetchWithAuth('/v1/care-circle/protected-number/activate', {
    method: 'POST',
  })
  return handleResponse<ProtectedNumberInfo>(response)
}

export async function getProtectedNumber(): Promise<ProtectedNumberInfo> {
  const response = await fetchWithAuth('/v1/care-circle/protected-number')
  return handleResponse<ProtectedNumberInfo>(response)
}

export async function listTrustedContacts(): Promise<TrustedContactInfo[]> {
  const response = await fetchWithAuth('/v1/care-circle/trusted-contacts')
  return handleResponse<TrustedContactInfo[]>(response)
}

export async function createTrustedContact(data: {
  first_name: string
  phone: string
  relationship?: string
  is_selected?: boolean
}): Promise<TrustedContactInfo> {
  const response = await fetchWithAuth('/v1/care-circle/trusted-contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return handleResponse<TrustedContactInfo>(response)
}

export async function updateTrustedContact(
  id: string,
  data: Partial<{
    first_name: string
    phone: string
    relationship: string
    is_selected: boolean
  }>
): Promise<TrustedContactInfo> {
  const response = await fetchWithAuth(`/v1/care-circle/trusted-contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return handleResponse<TrustedContactInfo>(response)
}

export async function deleteTrustedContact(id: string): Promise<void> {
  const response = await fetchWithAuth(`/v1/care-circle/trusted-contacts/${id}`, {
    method: 'DELETE',
  })
  await handleResponse<void>(response)
}

export async function bulkSelectContacts(isSelected: boolean): Promise<void> {
  const response = await fetchWithAuth('/v1/care-circle/trusted-contacts/bulk-select', {
    method: 'PUT',
    body: JSON.stringify({ is_selected: isSelected }),
  })
  await handleResponse<{ updated: number }>(response)
}

export async function updateShareEvent(
  contactId: string,
  data: Partial<{
    message_template: MessageTemplateKey
    custom_message: string
    sharing_status: SharingStatus
  }>
): Promise<ShareEventInfo> {
  const response = await fetchWithAuth(`/v1/care-circle/share-events/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return handleResponse<ShareEventInfo>(response)
}

export async function getShareOnboardingSummary(): Promise<ShareOnboardingSummary> {
  const response = await fetchWithAuth('/v1/care-circle/share-onboarding/summary')
  return handleResponse<ShareOnboardingSummary>(response)
}

export async function completeShareOnboarding(): Promise<void> {
  const response = await fetchWithAuth('/v1/care-circle/share-onboarding/complete', {
    method: 'POST',
  })
  await handleResponse(response)
}

export async function deferShareOnboarding(): Promise<void> {
  const response = await fetchWithAuth('/v1/care-circle/share-onboarding/defer', {
    method: 'POST',
  })
  await handleResponse(response)
}

export async function tryGetProtectedNumber(): Promise<ProtectedNumberInfo | null> {
  try {
    return await getProtectedNumber()
  } catch {
    return null
  }
}
