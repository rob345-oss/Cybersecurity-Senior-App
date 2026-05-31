'use client'

import { GoogleLogin, CredentialResponse } from '@react-oauth/google'

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => Promise<void>
  onError: (message: string) => void
  disabled?: boolean
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!clientId) {
    return (
      <p className="text-sm text-gray-500 text-center">
        Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment.
      </p>
    )
  }

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      onError('Google sign-in did not return a credential.')
      return
    }

    try {
      await onSuccess(response.credential)
    } catch {
      onError('Failed to sign in with Google. Please try again.')
    }
  }

  return (
    <div className={`flex justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError('Google sign-in was cancelled or failed.')}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width={320}
      />
    </div>
  )
}
