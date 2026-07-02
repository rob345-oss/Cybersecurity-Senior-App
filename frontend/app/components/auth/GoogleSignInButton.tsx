'use client'

import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { SocialLoginButton } from '@/app/components/ui/button'

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
      <SocialLoginButton
        provider="google"
        disabled
        onProviderClick={() =>
          onError('Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment.')
        }
      />
    )
  }

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      onError('Google sign-in did not return a credential.')
      return
    }

    try {
      await onSuccess(response.credential)
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Failed to sign in with Google. Please try again.'
      onError(message)
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
