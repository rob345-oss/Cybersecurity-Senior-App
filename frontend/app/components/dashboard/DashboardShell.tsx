'use client'

import { useState } from 'react'
import DashboardSidebar from './DashboardSidebar'
import { useTranslation } from '../../i18n/LanguageProvider'
import LanguageToggle from '../../i18n/LanguageToggle'

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { dictionary: d } = useTranslation()

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200 p-6">
        <DashboardSidebar />
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label={d.common.closeMenu}
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 p-6 transform transition-transform md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <DashboardSidebar onNavigate={closeMobile} />
      </aside>

      <div className="flex-1 md:pl-64">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 py-3 md:hidden">
          <button
            type="button"
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            aria-label={d.common.openMenu}
            onClick={() => setMobileOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-semibold text-gray-900 flex-1 truncate">{d.common.brandGuardian}</span>
          <LanguageToggle compact />
        </div>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
