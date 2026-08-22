'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  activateProtectedNumber,
  getShareOnboardingSummary,
  listTrustedContacts,
  type ProtectedNumberInfo,
  type ShareOnboardingSummary,
  type TrustedContactInfo,
} from './api'

interface ShareOnboardingContextValue {
  protectedNumber: ProtectedNumberInfo | null
  contacts: TrustedContactInfo[]
  summary: ShareOnboardingSummary | null
  loading: boolean
  error: string | null
  refreshAll: () => Promise<void>
  refreshContacts: () => Promise<void>
  setProtectedNumber: (info: ProtectedNumberInfo) => void
  setContacts: (contacts: TrustedContactInfo[]) => void
}

const ShareOnboardingContext = createContext<ShareOnboardingContextValue | undefined>(
  undefined
)

export function ShareOnboardingProvider({ children }: { children: ReactNode }) {
  const [protectedNumber, setProtectedNumber] = useState<ProtectedNumberInfo | null>(null)
  const [contacts, setContacts] = useState<TrustedContactInfo[]>([])
  const [summary, setSummary] = useState<ShareOnboardingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshContacts = useCallback(async () => {
    const data = await listTrustedContacts()
    setContacts(data)
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [numberInfo, contactList, summaryData] = await Promise.all([
        activateProtectedNumber(),
        listTrustedContacts(),
        getShareOnboardingSummary(),
      ])
      setProtectedNumber(numberInfo)
      setContacts(contactList)
      setSummary(summaryData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load share onboarding data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const value = useMemo(
    () => ({
      protectedNumber,
      contacts,
      summary,
      loading,
      error,
      refreshAll,
      refreshContacts,
      setProtectedNumber,
      setContacts,
    }),
    [protectedNumber, contacts, summary, loading, error, refreshAll, refreshContacts]
  )

  return (
    <ShareOnboardingContext.Provider value={value}>{children}</ShareOnboardingContext.Provider>
  )
}

export function useShareOnboarding() {
  const context = useContext(ShareOnboardingContext)
  if (!context) {
    throw new Error('useShareOnboarding must be used within ShareOnboardingProvider')
  }
  return context
}
