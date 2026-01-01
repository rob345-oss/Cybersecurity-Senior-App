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
    agentId: 'inboxguard', // Uses InboxGuard for URL analysis
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
    agentId: null, // Not yet implemented
  },
]

export default function Features() {
  return (
    <section id="product" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Protection
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Six powerful guards working together to keep you safe
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173"
            const featureLink = feature.agentId ? `${appUrl}?agent=${feature.agentId}` : appUrl
            
            const CardContent = (
              <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-gray-900" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
                {feature.agentId && (
                  <div className="mt-4">
                    <span className="text-sm text-gray-500">Click to use →</span>
                  </div>
                )}
              </div>
            )
            
            return feature.agentId ? (
              <a
                key={feature.title}
                href={featureLink}
                className="block"
              >
                {CardContent}
              </a>
            ) : (
              <div key={feature.title}>
                {CardContent}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

