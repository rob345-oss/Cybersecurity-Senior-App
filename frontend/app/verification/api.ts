import { fetchWithAuth, getErrorMessage, getStoredTokens } from '../utils/auth'
import type {
  CreateVerificationRequestPayload,
  ListRole,
  ReviewVerificationPayload,
  RiskAnalysisResult,
  TrustedContact,
  VerificationRequest,
} from '../types/verification'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function handleJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail: unknown = 'Request failed'
    try {
      const data = await response.json()
      detail = data.detail ?? detail
    } catch {
      detail = response.statusText || `HTTP ${response.status}`
    }
    throw new Error(getErrorMessage(detail, 'Request failed'))
  }
  return response.json()
}

export async function listTrustedContacts(): Promise<TrustedContact[]> {
  const response = await fetchWithAuth('/v1/trusted-contacts')
  return handleJson<TrustedContact[]>(response)
}

export async function addTrustedContact(
  contactEmail: string,
  label?: string
): Promise<TrustedContact> {
  const response = await fetchWithAuth('/v1/trusted-contacts', {
    method: 'POST',
    body: JSON.stringify({ contact_email: contactEmail, label }),
  })
  return handleJson<TrustedContact>(response)
}

export async function createVerificationRequest(
  payload: CreateVerificationRequestPayload
): Promise<VerificationRequest> {
  const response = await fetchWithAuth('/v1/verification-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return handleJson<VerificationRequest>(response)
}

export async function listVerificationRequests(
  role: ListRole = 'all'
): Promise<VerificationRequest[]> {
  const response = await fetchWithAuth(`/v1/verification-requests?role=${role}`)
  return handleJson<VerificationRequest[]>(response)
}

export async function getVerificationRequest(
  requestId: string
): Promise<VerificationRequest> {
  const response = await fetchWithAuth(`/v1/verification-requests/${requestId}`)
  return handleJson<VerificationRequest>(response)
}

export async function reviewVerificationRequest(
  requestId: string,
  payload: ReviewVerificationPayload
): Promise<VerificationRequest> {
  const response = await fetchWithAuth(`/v1/verification-requests/${requestId}/review`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return handleJson<VerificationRequest>(response)
}

export async function runRiskAnalysis(requestId: string): Promise<RiskAnalysisResult> {
  const response = await fetchWithAuth(
    `/v1/verification-requests/${requestId}/risk-analysis`,
    { method: 'POST' }
  )
  return handleJson<RiskAnalysisResult>(response)
}

export async function uploadScreenshot(
  requestId: string,
  file: File
): Promise<VerificationRequest> {
  const tokens = getStoredTokens()
  const formData = new FormData()
  formData.append('file', file)

  const headers: Record<string, string> = {}
  if (tokens?.access_token) {
    headers.Authorization = `Bearer ${tokens.access_token}`
  }

  const response = await fetch(
    `${API_URL}/v1/verification-requests/${requestId}/screenshot`,
    {
      method: 'POST',
      headers,
      body: formData,
    }
  )
  return handleJson<VerificationRequest>(response)
}

export function resolveScreenshotUrl(path?: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_URL}${path}`
}
