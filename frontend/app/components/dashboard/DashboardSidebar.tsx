'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { dashboardNavItems } from './navConfig'
import UserMenu from './UserMenu'

interface DashboardSidebarProps {
  onNavigate?: () => void
}

export default function DashboardSidebar({ onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <Link href="/dashboard" className="block" onClick={onNavigate}>
          <span className="text-lg font-bold text-gray-900">Titanium Guardian</span>
          <span className="block text-xs text-gray-500 mt-1">Your digital guardian</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        {dashboardNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <UserMenu className="mt-auto" />
    </div>
  )
}
