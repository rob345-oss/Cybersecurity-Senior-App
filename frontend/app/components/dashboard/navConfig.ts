import type { LucideIcon } from 'lucide-react'
import { DollarSign, LayoutDashboard, Mail, Phone, User } from 'lucide-react'

/**
 * Structural dashboard navigation (labels come from i18n dictionaries).
 */
export interface DashboardNavItem {
  href: string
  icon: LucideIcon
  guardKey?: 'callguard' | 'moneyguard' | 'inboxguard' | 'identitywatch'
}

export const dashboardNavItems: DashboardNavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard },
  { href: '/dashboard/callguard', icon: Phone, guardKey: 'callguard' },
  { href: '/dashboard/moneyguard', icon: DollarSign, guardKey: 'moneyguard' },
  { href: '/dashboard/inboxguard', icon: Mail, guardKey: 'inboxguard' },
  { href: '/dashboard/identitywatch', icon: User, guardKey: 'identitywatch' },
]

export const modulePageMeta: Record<
  string,
  { guardKey?: 'callguard' | 'moneyguard' | 'inboxguard' | 'identitywatch'; comingSoon?: boolean }
> = {
  '/dashboard': {},
  '/dashboard/callguard': { guardKey: 'callguard' },
  '/dashboard/moneyguard': { guardKey: 'moneyguard', comingSoon: true },
  '/dashboard/inboxguard': { guardKey: 'inboxguard', comingSoon: true },
  '/dashboard/identitywatch': { guardKey: 'identitywatch', comingSoon: true },
}
