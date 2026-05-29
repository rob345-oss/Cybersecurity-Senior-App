import { useMemo, useState, useEffect, type ReactNode } from 'react'
import { ToastProvider } from './contexts/ToastContext'
import { useAuth } from './contexts/AuthContext'
import CallGuard from './modules/CallGuard'
import MoneyGuard from './modules/MoneyGuard'
import InboxGuard from './modules/InboxGuard'
import IdentityWatch from './modules/IdentityWatch'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import VerifyEmail from './components/auth/VerifyEmail'
import AuthLayout, { AuthView } from './components/layout/AuthLayout'
import AppShell, { TabConfig } from './components/layout/AppShell'
import { Phone, DollarSign, Mail, User } from 'lucide-react'

const tabDefinitions: Omit<TabConfig, 'component'>[] = [
  {
    id: 'callguard',
    label: 'CallGuard',
    description: 'Live coaching for suspicious calls.',
    icon: Phone,
  },
  {
    id: 'moneyguard',
    label: 'MoneyGuard',
    description: 'Assess payment risk before you send.',
    icon: DollarSign,
  },
  {
    id: 'inboxguard',
    label: 'InboxGuard',
    description: 'Analyze messages and links for phishing.',
    icon: Mail,
  },
  {
    id: 'identitywatch',
    label: 'IdentityWatch',
    description: 'Monitor identity signals and escalation steps.',
    icon: User,
  },
]

const moduleComponents: Record<string, ReactNode> = {
  callguard: <CallGuard />,
  moneyguard: <MoneyGuard />,
  inboxguard: <InboxGuard />,
  identitywatch: <IdentityWatch />,
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
      <div className="spinner" role="status" aria-label="Loading" />
      <p className="text-sm text-slate-600">Loading Titanium Guardian...</p>
    </div>
  )
}

function AuthenticatedApp({ initialAgent }: { initialAgent: string | null }) {
  const [activeTabId, setActiveTabId] = useState(initialAgent || 'callguard')
  const { user, logout } = useAuth()

  const tabs: TabConfig[] = useMemo(
    () =>
      tabDefinitions.map((tab) => ({
        ...tab,
        component: moduleComponents[tab.id],
      })),
    []
  )

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [activeTabId, tabs]
  )

  useEffect(() => {
    if (initialAgent && tabs.some((tab) => tab.id === initialAgent)) {
      setActiveTabId(initialAgent)
    }
  }, [initialAgent, tabs])

  return (
    <AppShell
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTabId}
      userEmail={user?.email}
      emailVerified={user?.email_verified}
      onLogout={logout}
    />
  )
}

export default function App() {
  const { isAuthenticated, loading } = useAuth()
  const [authView, setAuthView] = useState<AuthView>('login')
  const [initialAgent, setInitialAgent] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const agent = params.get('agent')
    if (agent) setInitialAgent(agent)
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <AuthLayout activeView={authView} onViewChange={setAuthView}>
          {authView === 'login' && <Login />}
          {authView === 'register' && <Register />}
          {authView === 'verify' && <VerifyEmail />}
        </AuthLayout>
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <AuthenticatedApp initialAgent={initialAgent} />
    </ToastProvider>
  )
}
