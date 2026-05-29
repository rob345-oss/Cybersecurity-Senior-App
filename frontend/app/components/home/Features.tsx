'use client'

import { Phone, Mail, Shield, User, DollarSign, Users } from 'lucide-react'

const features = [
  {
    icon: Phone,
    title: 'CallGuard',
    description: 'Live coaching during suspicious calls to help you make safe decisions in real-time.',
    agentId: 'callguard',
  },
  {
    icon: Mail,
    title: 'InboxGuard',
    description: 'Analyze messages and links for phishing attempts before you click or respond.',
    agentId: 'inboxguard',
  },
  {
    icon: Shield,
    title: 'WebGuardian',
    description: 'Protect against malicious websites and fraudulent online activities.',
    agentId: 'inboxguard',
  },
  {
    icon: User,
    title: 'IdentityWatch',
    description: 'Monitor identity signals and escalate when suspicious activity is detected.',
    agentId: 'identitywatch',
  },
  {
    icon: DollarSign,
    title: 'MoneyGuard',
    description: 'Assess payment risk before you send money to prevent financial scams.',
    agentId: 'moneyguard',
  },
  {
    icon: Users,
    title: 'CareCircle',
    description: 'Connect with trusted family members for support and peace of mind.',
    agentId: null,
  },
]

export default function Features() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'

  return (
    <section id="product" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-slate-900">Comprehensive Protection</h2>
          <p className="mx-auto max-w-2xl text-xl text-slate-600">
            Six powerful guards working together to keep you safe
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            const featureLink = feature.agentId ? `${appUrl}?agent=${feature.agentId}` : appUrl

            const card = (
              <div className="card-surface group h-full p-8 transition-all hover:border-teal-200 hover:shadow-card-hover">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-brand-accent transition-colors group-hover:bg-teal-100">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="leading-relaxed text-slate-600">{feature.description}</p>
                {feature.agentId && (
                  <p className="mt-4 text-sm font-medium text-brand-accent">Open in app →</p>
                )}
              </div>
            )

            return feature.agentId ? (
              <a key={feature.title} href={featureLink} className="block">
                {card}
              </a>
            ) : (
              <div key={feature.title}>{card}</div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
