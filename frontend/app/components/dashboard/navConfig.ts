import type { LucideIcon } from 'lucide-react'
import {
  DollarSign,
  LayoutDashboard,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'

export interface DashboardNavItem {
  href: string
  label: string
  icon: LucideIcon
  description?: string
}

export const dashboardNavItems: DashboardNavItem[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  {
    href: '/dashboard/verify',
    label: 'Ask Family',
    icon: ShieldCheck,
    description: 'Send a suspicious interaction for trusted review',
  },
  {
    href: '/dashboard/family',
    label: 'CareCircle',
    icon: Users,
    description: 'Trusted contacts and family reviews',
  },
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
]

export const modulePageMeta: Record<
  string,
  { title: string; description: string; comingSoon?: boolean }
> = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'Your security command center',
  },
  '/dashboard/verify': {
    title: 'Ask Family',
    description: 'Trusted contact verification',
  },
  '/dashboard/family': {
    title: 'CareCircle',
    description: 'Trusted contacts and family reviews',
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
}
