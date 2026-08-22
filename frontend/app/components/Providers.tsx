'use client'

import { AuthProvider } from '../contexts/AuthContext'
import GoogleAuthProvider from './auth/GoogleAuthProvider'
import { LanguageProvider } from '../i18n/LanguageProvider'
import type { Locale } from '../i18n/config'

export default function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale: Locale
}) {
  return (
    <LanguageProvider initialLocale={initialLocale}>
      <GoogleAuthProvider>
        <AuthProvider>{children}</AuthProvider>
      </GoogleAuthProvider>
    </LanguageProvider>
  )
}
