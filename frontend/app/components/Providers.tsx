'use client'

import { AuthProvider } from '../contexts/AuthContext'
import GoogleAuthProvider from './auth/GoogleAuthProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleAuthProvider>
      <AuthProvider>{children}</AuthProvider>
    </GoogleAuthProvider>
  )
}
