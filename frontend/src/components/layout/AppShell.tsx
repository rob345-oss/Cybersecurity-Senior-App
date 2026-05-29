import { ReactNode } from 'react'
import { Phone, DollarSign, Mail, User, Shield, LogOut } from 'lucide-react'

export interface TabConfig {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  component: ReactNode
}

interface AppShellProps {
  tabs: TabConfig[]
  activeTab: TabConfig
  onTabChange: (id: string) => void
  userEmail?: string
  emailVerified?: boolean
  onLogout: () => void
}

export default function AppShell({
  tabs,
  activeTab,
  onTabChange,
  userEmail,
  emailVerified,
  onLogout,
}: AppShellProps) {
  const initial = userEmail?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-400" aria-hidden />
            Titanium Guardian
          </span>
          <span>Cross-platform security companion</span>
        </div>

        <nav className="tab-list" aria-label="Protection modules">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.id === activeTab.id
            return (
              <button
                key={tab.id}
                type="button"
                className={`tab-button ${isActive ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto space-y-4 border-t border-slate-700 pt-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{userEmail}</p>
              {!emailVerified && (
                <p className="text-xs text-amber-400">Email not verified</p>
              )}
              {emailVerified && (
                <p className="text-xs text-teal-400">Verified</p>
              )}
            </div>
          </div>
          <button type="button" onClick={onLogout} className="btn-danger w-full">
            <LogOut className="h-4 w-4" aria-hidden />
            Log out
          </button>
        </div>

        <p className="helper-note text-slate-500">
          Install this app from your mobile browser to use it on Android, ChromeOS, and desktop.
        </p>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <h1>{activeTab.label}</h1>
            <p>{activeTab.description}</p>
          </div>
        </header>
        {activeTab.component}
      </main>
    </div>
  )
}

export const defaultTabIcons = {
  callguard: Phone,
  moneyguard: DollarSign,
  inboxguard: Mail,
  identitywatch: User,
}
