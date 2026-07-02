'use client'

import Link from 'next/link'
import { BookOpen, DollarSign, Mail, Phone, Shield, User, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import { getDisplayName } from '../utils/auth'

const quickActions = [
  {
    title: "I'm on a call — help me",
    subtitle: 'Live coaching for suspicious callers',
    href: '/dashboard/callguard',
  },
  {
    title: 'Before I send money',
    subtitle: 'Check payment risk fast',
    href: '/dashboard/moneyguard',
  },
  {
    title: 'Check a message or link',
    subtitle: 'Inbox phishing triage',
    href: '/dashboard/inboxguard',
  },
  {
    title: 'Identity protection steps',
    subtitle: 'Freeze credit checklist',
    href: '/dashboard/identitywatch',
  },
  {
    title: 'Learn how to spot scams',
    subtitle: 'Short lessons on common scam types',
    href: '/dashboard/lessons',
  },
]

const guards = [
  {
    title: 'CallGuard',
    description: 'Live coaching during suspicious calls.',
    href: '/dashboard/callguard',
    icon: Phone,
    available: true,
  },
  {
    title: 'MoneyGuard',
    description: 'Assess payment risk before you send money.',
    href: '/dashboard/moneyguard',
    icon: DollarSign,
    available: false,
  },
  {
    title: 'InboxGuard',
    description: 'Analyze messages and links for phishing.',
    href: '/dashboard/inboxguard',
    icon: Mail,
    available: false,
  },
  {
    title: 'IdentityWatch',
    description: 'Monitor identity signals and escalation steps.',
    href: '/dashboard/identitywatch',
    icon: User,
    available: false,
  },
  {
    title: 'Lesson Library',
    description: 'Learn how to recognize scams before they happen.',
    href: '/dashboard/lessons',
    icon: BookOpen,
    available: true,
  },
  {
    title: 'CareCircle',
    description: 'Connect with trusted family members for support.',
    href: null,
    icon: Users,
    available: false,
    disabled: true,
  },
]

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  const firstName = getDisplayName(user)

  return (
    <>
      <DashboardHeader
        title={`Welcome back, ${firstName}`}
        description="Choose a guard below or jump into a quick action."
      />

      {!user.email_verified && (
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <p className="text-sm font-medium">Please verify your email address</p>
          <p className="text-sm mt-1 text-amber-800">
            Check your inbox for a verification link, or contact support if you need help.
          </p>
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all"
            >
              <strong className="text-gray-900 block mb-1">{action.title}</strong>
              <p className="text-sm text-gray-600">{action.subtitle}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your guards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guards.map((guard) => {
            const Icon = guard.icon
            const card = (
              <div
                className={`bg-white p-6 rounded-xl border border-gray-200 h-full ${
                  guard.disabled
                    ? 'opacity-60 cursor-not-allowed'
                    : guard.available
                      ? 'hover:shadow-lg hover:border-gray-300 transition-shadow cursor-pointer'
                      : 'hover:shadow-md transition-shadow cursor-pointer'
                }`}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-gray-900" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{guard.title}</h3>
                  {guard.available ? (
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      Open
                    </span>
                  ) : guard.disabled ? null : (
                    <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{guard.description}</p>
                {guard.available && (
                  <span className="inline-block mt-4 text-sm font-medium text-gray-900">
                    Open →
                  </span>
                )}
              </div>
            )

            if (guard.href && !guard.disabled) {
              return (
                <Link key={guard.title} href={guard.href} className="block">
                  {card}
                </Link>
              )
            }

            return <div key={guard.title}>{card}</div>
          })}
        </div>
      </section>

      <section className="mt-10 bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
        <Shield className="w-8 h-8 text-gray-900 shrink-0" />
        <div>
          <h3 className="font-semibold text-gray-900">Tip</h3>
          <p className="text-sm text-gray-600 mt-1">
            On a suspicious call right now? Open CallGuard and tap the signals you recognize for
            live coaching.
          </p>
          <Link
            href="/dashboard/callguard"
            className="inline-block mt-3 text-sm font-medium text-gray-900 hover:underline"
          >
            Go to CallGuard →
          </Link>
        </div>
      </section>
    </>
  )
}
