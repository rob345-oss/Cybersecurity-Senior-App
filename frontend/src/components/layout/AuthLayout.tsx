import { ReactNode } from 'react'
import { Shield } from 'lucide-react'

export type AuthView = 'login' | 'register' | 'verify'

interface AuthLayoutProps {
  activeView: AuthView
  onViewChange: (view: AuthView) => void
  children: ReactNode
}

const tabs: { id: AuthView; label: string }[] = [
  { id: 'login', label: 'Log In' },
  { id: 'register', label: 'Register' },
  { id: 'verify', label: 'Verify Email' },
]

export default function AuthLayout({ activeView, onViewChange, children }: AuthLayoutProps) {
  return (
    <div className="auth-shell">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary text-white">
            <Shield className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Titanium Guardian</h1>
            <p className="text-xs text-slate-500">Cross-platform security companion</p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="auth-card w-full max-w-md">
          <div className="auth-tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeView === tab.id}
                className={`auth-tab ${activeView === tab.id ? 'active' : ''}`}
                onClick={() => onViewChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
