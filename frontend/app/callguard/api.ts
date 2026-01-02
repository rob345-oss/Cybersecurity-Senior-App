// API utilities for CallGuard page

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface RiskResponse {
  score: number
  level: string
  reasons: string[]
  next_action: string
  recommended_actions: RecommendedAction[]
  safe_script?: SafeScript
  metadata?: Record<string, any>
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

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (typeof window !== 'undefined') {
    const accessToken = sessionStorage.getItem('access_token')
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
  }

  return headers
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
  payload: Record<string, any>
  timestamp: string
}): Promise<RiskResponse> {
  const response = await fetch(`${BASE_URL}/v1/session/${sessionId}/event`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(event),
  })
  return handleResponse<RiskResponse>(response)
}

export interface UserResponse {
  id: string
  email: string
  full_name?: string
  phone?: string
  email_verified: boolean
  created_at: string
}

export async function getCurrentUser(): Promise<UserResponse> {
  const response = await fetch(`${BASE_URL}/v1/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return handleResponse<UserResponse>(response)
}

