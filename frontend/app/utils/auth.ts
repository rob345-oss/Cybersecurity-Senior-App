export interface AuthTokenResponse {
  access_token: string
  refresh_token: string
}

export function storeAuthTokens(data: AuthTokenResponse) {
  sessionStorage.setItem('access_token', data.access_token)
  sessionStorage.setItem('refresh_token', data.refresh_token)
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

export async function exchangeGoogleToken(idToken: string): Promise<AuthTokenResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const response = await fetch(`${apiUrl}/v1/auth/google`, {
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
