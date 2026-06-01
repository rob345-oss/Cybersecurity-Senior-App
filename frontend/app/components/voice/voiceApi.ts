import { getAuthHeaders } from '../../utils/auth'
import type { RiskResponse } from '../../callguard/api'

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface VoiceTokenResponse {
  token: string
  identity: string
}

export interface VoiceWsMessage {
  type: string
  risk?: RiskResponse
  transcript?: string
  chunk?: string
  signals?: string[]
  session_id?: string
  call_sid?: string
  message?: string
  status?: string
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = 'Request failed'
    try {
      const data = await response.json()
      detail = data.detail || data.message || detail
    } catch {
      detail = response.statusText
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return response.json()
}

export async function getVoiceToken(): Promise<VoiceTokenResponse> {
  const response = await fetch(`${getApiUrl()}/v1/voice/token`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  return handleResponse<VoiceTokenResponse>(response)
}

export async function startOutboundCall(to: string, sessionId?: string): Promise<{ call_sid: string; session_id: string }> {
  const response = await fetch(`${getApiUrl()}/v1/voice/outbound`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ to, session_id: sessionId }),
  })
  return handleResponse(response)
}

export async function endVoiceCall(callSid: string): Promise<void> {
  const response = await fetch(`${getApiUrl()}/v1/voice/calls/${encodeURIComponent(callSid)}/end`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  await handleResponse(response)
}

export async function registerBrowserCall(
  sessionId: string,
  callSid: string,
  direction: string,
  from: string,
  to: string
): Promise<void> {
  const response = await fetch(`${getApiUrl()}/v1/voice/sessions/${encodeURIComponent(sessionId)}/register-call`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ call_sid: callSid, direction, from, to }),
  })
  await handleResponse(response)
}

export function getVoiceWebSocketUrl(sessionId: string): string {
  const apiUrl = getApiUrl()
  const wsBase = apiUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : ''
  return `${wsBase}/v1/voice/ws?session_id=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token || '')}`
}
