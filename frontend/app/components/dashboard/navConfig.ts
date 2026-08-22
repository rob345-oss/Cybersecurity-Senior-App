import type { LucideIcon } from 'lucide-react'
import { DollarSign, LayoutDashboard, Mail, Phone, User, Users } from 'lucide-react'

export interface DashboardNavItem {
  href: string
  label: string
  icon: LucideIcon
  description?: string
}

export const dashboardNavItems: DashboardNavItem[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  {
    href: '/dashboard/callguard',
    label: 'CallGuard',
    icon: Phone,
    description: 'Live coaching for suspicious calls',
  },
  {
    href: '/dashboard/moneyguard',
    label: 'MoneyGuard',
    icon: DollarSign,
    description: 'Assess payment risk before you send',
  },
  {
    href: '/dashboard/inboxguard',
    label: 'InboxGuard',
    icon: Mail,
    description: 'Analyze messages and links for phishing',
  },
  {
    href: '/dashboard/identitywatch',
    label: 'IdentityWatch',
    icon: User,
    description: 'Monitor identity signals and escalation steps',
  },
  {
    href: '/dashboard/share-number',
    label: 'CareCircle',
    icon: Users,
    description: 'Share your protected number with trusted contacts',
  },
]

export const modulePageMeta: Record<
  string,
  { title: string; description: string; comingSoon?: boolean }
> = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'Your security command center',
  },
  '/dashboard/callguard': {
    title: 'CallGuard',
    description: 'Live coaching for suspicious calls',
  },
  '/dashboard/moneyguard': {
    title: 'MoneyGuard',
    description: 'Assess payment risk before you send',
    comingSoon: true,
  },
  '/dashboard/inboxguard': {
    title: 'InboxGuard',
    description: 'Analyze messages and links for phishing',
    comingSoon: true,
  },
  '/dashboard/identitywatch': {
    title: 'IdentityWatch',
    description: 'Monitor identity signals and escalation steps',
    comingSoon: true,
  },
  '/dashboard/share-number': {
    title: 'CareCircle',
    description: 'Share your protected number with trusted contacts',
  },
}
