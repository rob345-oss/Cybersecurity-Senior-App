// API utilities for CallGuard page

import { getAuthHeaders, getCurrentUser } from '../utils/auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface RiskResponse {
  score: number
  level: string
  reasons: string[]
  next_action: string
  recommended_actions: RecommendedAction[]
  safe_script?: SafeScript
  metadata?: Record<string, unknown>
}

export interface RecommendedAction {
  id: string
  title: string
  detail: string
}

export interface SafeScript {
  say_this: string
  if_they_push_back: string
}

export interface SessionStartResponse {
  session_id: string
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'Request failed'
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
    } catch {
      errorMessage = response.statusText || `HTTP ${response.status}`
    }
    throw new Error(errorMessage)
  }
  return response.json()
}

export async function startSession(userId: string): Promise<SessionStartResponse> {
  const response = await fetch(`${BASE_URL}/v1/session/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      user_id: userId,
      device_id: 'web',
      module: 'callguard',
      context: null,
    }),
  })
  return handleResponse<SessionStartResponse>(response)
}

export async function addEvent(sessionId: string, event: {
  type: string
  payload: Record<string, unknown>
  timestamp: string
}): Promise<RiskResponse> {
  const response = await fetch(`${BASE_URL}/v1/session/${sessionId}/event`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(event),
  })
  return handleResponse<RiskResponse>(response)
}

export { getCurrentUser }
