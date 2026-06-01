'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  AuthTokenResponse,
  clearAuthTokens,
  getCurrentUser,
  hasStoredTokens,
  loadAuthenticatedUser,
  storeAuthTokens,
  type UserResponse,
} from '../utils/auth'

interface AuthContextType {
  user: UserResponse | null
  loading: boolean
  isAuthenticated: boolean
  loginWithTokens: (data: AuthTokenResponse) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const loaded = await loadAuthenticatedUser()
    setUser(loaded)
  }, [])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      if (!hasStoredTokens()) {
        if (!cancelled) setLoading(false)
        return
      }

      try {
        const loaded = await loadAuthenticatedUser()
        if (!cancelled) setUser(loaded)
      } catch {
        if (!cancelled) {
          clearAuthTokens()
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  const loginWithTokens = useCallback(async (data: AuthTokenResponse) => {
    storeAuthTokens(data)
    const userData = await getCurrentUser()
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    clearAuthTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        loginWithTokens,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
