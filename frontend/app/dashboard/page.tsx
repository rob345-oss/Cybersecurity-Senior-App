'use client'

import Link from 'next/link'
import { DollarSign, Mail, Phone, Shield, User, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import { getDisplayName } from '../utils/auth'
import { useTranslation } from '../i18n/LanguageProvider'
import { interpolate } from '../i18n/get-dictionary'

export default function DashboardPage() {
  const { user } = useAuth()
  const { dictionary: d } = useTranslation()

  if (!user) return null

  const firstName = getDisplayName(user)

  const quickActions = [
    {
      title: d.dashboard.quickActionCall.title,
      subtitle: d.dashboard.quickActionCall.subtitle,
      href: '/dashboard/callguard',
    },
    {
      title: d.dashboard.quickActionMoney.title,
      subtitle: d.dashboard.quickActionMoney.subtitle,
      href: '/dashboard/moneyguard',
    },
    {
      title: d.dashboard.quickActionInbox.title,
      subtitle: d.dashboard.quickActionInbox.subtitle,
      href: '/dashboard/inboxguard',
    },
    {
      title: d.dashboard.quickActionIdentity.title,
      subtitle: d.dashboard.quickActionIdentity.subtitle,
      href: '/dashboard/identitywatch',
    },
  ]

  const guards = [
    {
      title: d.dashboard.guards.callguard.title,
      description: d.dashboard.guards.callguard.description,
      href: '/dashboard/callguard',
      icon: Phone,
      available: true,
    },
    {
      title: d.dashboard.guards.moneyguard.title,
      description: d.dashboard.guards.moneyguard.description,
      href: '/dashboard/moneyguard',
      icon: DollarSign,
      available: false,
    },
    {
      title: d.dashboard.guards.inboxguard.title,
      description: d.dashboard.guards.inboxguard.description,
      href: '/dashboard/inboxguard',
      icon: Mail,
      available: false,
    },
    {
      title: d.dashboard.guards.identitywatch.title,
      description: d.dashboard.guards.identitywatch.description,
      href: '/dashboard/identitywatch',
      icon: User,
      available: false,
    },
    {
      title: d.dashboard.guards.carecircle.title,
      description: d.dashboard.guards.carecircle.description,
      href: null,
      icon: Users,
      available: false,
      disabled: true,
    },
  ]

  return (
    <>
      <DashboardHeader
        title={interpolate(d.dashboard.welcome, { name: firstName })}
        description={d.dashboard.welcomeDescription}
      />

      {!user.email_verified && (
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <p className="text-sm font-medium">{d.dashboard.verifyEmailTitle}</p>
          <p className="text-sm mt-1 text-amber-800">
            {d.dashboard.verifyEmailBody}
          </p>
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{d.dashboard.quickActions}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{d.dashboard.yourGuards}</h2>
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
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900">{guard.title}</h3>
                  {guard.available ? (
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      {d.common.open}
                    </span>
                  ) : guard.disabled ? null : (
                    <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                      {d.common.comingSoon}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{guard.description}</p>
                {guard.available && (
                  <span className="inline-block mt-4 text-sm font-medium text-gray-900">
                    {d.common.openArrow}
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
          <h3 className="font-semibold text-gray-900">{d.dashboard.tipTitle}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {d.dashboard.tipBody}
          </p>
          <Link
            href="/dashboard/callguard"
            className="inline-block mt-3 text-sm font-medium text-gray-900 hover:underline"
          >
            {d.dashboard.tipCta}
          </Link>
        </div>
      </section>
    </>
  )
}
