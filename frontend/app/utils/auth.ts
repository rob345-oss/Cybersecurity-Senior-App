export interface AuthTokenResponse {
  access_token: string
  refresh_token: string
}

export interface UserResponse {
  id: string
  email: string
  full_name?: string
  phone?: string
  email_verified: boolean
  created_at: string
}

export interface RefreshTokenResponse {
  access_token: string
  token_type: string
}

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function storeAuthTokens(data: AuthTokenResponse) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem('access_token', data.access_token)
  sessionStorage.setItem('refresh_token', data.refresh_token)
}

export function getStoredTokens(): AuthTokenResponse | null {
  if (typeof window === 'undefined') return null
  const access_token = sessionStorage.getItem('access_token')
  const refresh_token = sessionStorage.getItem('refresh_token')
  if (!access_token || !refresh_token) return null
  return { access_token, refresh_token }
}

export function hasStoredTokens(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(sessionStorage.getItem('access_token'))
}

export function clearAuthTokens() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('refresh_token')
}

export function getAuthHeaders(): Record<string, string> {
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

export function getErrorMessage(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') {
    return detail
  }
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg ?? String(item)).join(', ')
  }
  return fallback
}

async function handleAuthResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'Request failed'
    try {
      const errorData = await response.json()
      errorMessage = getErrorMessage(errorData.detail, errorMessage)
    } catch {
      errorMessage = response.statusText || `HTTP ${response.status}`
    }
    const error = new Error(errorMessage) as Error & { status?: number }
    error.status = response.status
    throw error
  }
  return response.json()
}

export async function fetchWithAuth(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${getApiUrl()}${path}`
  return fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  })
}

export async function getCurrentUser(): Promise<UserResponse> {
  const response = await fetchWithAuth('/v1/auth/me', { method: 'GET' })
  return handleAuthResponse<UserResponse>(response)
}

export async function refreshAccessToken(): Promise<RefreshTokenResponse> {
  const refresh_token = sessionStorage.getItem('refresh_token')
  if (!refresh_token) {
    throw new Error('No refresh token available')
  }

  const response = await fetch(`${getApiUrl()}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  })

  const data = await handleAuthResponse<RefreshTokenResponse>(response)
  sessionStorage.setItem('access_token', data.access_token)
  return data
}

export async function loadAuthenticatedUser(): Promise<UserResponse | null> {
  if (!hasStoredTokens()) return null

  try {
    return await getCurrentUser()
  } catch (error) {
    const status = (error as Error & { status?: number }).status
    if (status !== 401) throw error

    try {
      await refreshAccessToken()
      return await getCurrentUser()
    } catch {
      clearAuthTokens()
      return null
    }
  }
}

export async function exchangeGoogleToken(idToken: string): Promise<AuthTokenResponse> {
  const response = await fetch(`${getApiUrl()}/v1/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id_token: idToken }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(getErrorMessage(data.detail, 'Failed to sign in with Google.'))
  }

  return data
}

export function getDisplayName(user: UserResponse): string {
  if (user.full_name?.trim()) {
    return user.full_name.trim().split(/\s+/)[0]
  }
  return user.email.split('@')[0]
}
