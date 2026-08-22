'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DollarSign, LayoutDashboard, Mail, Phone, User } from 'lucide-react'
import UserMenu from './UserMenu'
import { useTranslation } from '../../i18n/LanguageProvider'
import LanguageToggle from '../../i18n/LanguageToggle'

interface DashboardSidebarProps {
  onNavigate?: () => void
}

export default function DashboardSidebar({ onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { dictionary: d } = useTranslation()

  const navItems = [
    { href: '/dashboard', label: d.dashboard.navHome, icon: LayoutDashboard },
    {
      href: '/dashboard/callguard',
      label: d.dashboard.guards.callguard.title,
      icon: Phone,
    },
    {
      href: '/dashboard/moneyguard',
      label: d.dashboard.guards.moneyguard.title,
      icon: DollarSign,
    },
    {
      href: '/dashboard/inboxguard',
      label: d.dashboard.guards.inboxguard.title,
      icon: Mail,
    },
    {
      href: '/dashboard/identitywatch',
      label: d.dashboard.guards.identitywatch.title,
      icon: User,
    },
  ]

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
          <span className="text-lg font-bold text-gray-900">{d.common.brandGuardian}</span>
          <span className="block text-xs text-gray-500 mt-1">{d.dashboard.tagline}</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
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
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="hidden md:block mb-4">
        <LanguageToggle />
      </div>

      <UserMenu className="mt-auto" />
    </div>
  )
}
