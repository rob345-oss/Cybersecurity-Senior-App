'use client'

import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { useTranslation } from '../../i18n/LanguageProvider'

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
  const { dictionary: d, locale } = useTranslation()
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!clientId) {
    return (
      <p className="text-sm text-gray-500 text-center">
        {d.googleAuth.notConfigured}
      </p>
    )
  }

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      onError(d.googleAuth.noCredential)
      return
    }

    try {
      await onSuccess(response.credential)
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : d.googleAuth.failed
      onError(message)
    }
  }

  return (
    <div className={`flex justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError(d.googleAuth.cancelled)}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width={320}
        locale={locale === 'es' ? 'es' : 'en'}
      />
    </div>
  )
}
