'use client'

import { Phone, Mail, Shield, User, DollarSign, Users } from 'lucide-react'
import { useTranslation } from '../../i18n/LanguageProvider'

const featureDefs = [
  { icon: Phone, key: 'callguard' as const, agentId: 'callguard' },
  { icon: Mail, key: 'inboxguard' as const, agentId: 'inboxguard' },
  { icon: Shield, key: 'webguardian' as const, agentId: 'inboxguard' },
  { icon: User, key: 'identitywatch' as const, agentId: 'identitywatch' },
  { icon: DollarSign, key: 'moneyguard' as const, agentId: 'moneyguard' },
  { icon: Users, key: 'carecircle' as const, agentId: null },
]

export default function Features() {
  const { dictionary: d } = useTranslation()

  return (
    <section id="product" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {d.features.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {d.features.subtitle}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureDefs.map((feature) => {
            const Icon = feature.icon
            const copy = d.features[feature.key]
            const featureLink = feature.agentId
              ? `/dashboard/${feature.agentId}`
              : '/login'

            const CardContent = (
              <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-gray-900" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {copy.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {copy.description}
                </p>
                {feature.agentId && (
                  <div className="mt-4">
                    <span className="text-sm text-gray-500">{d.common.clickToUse}</span>
                  </div>
                )}
              </div>
            )

            return feature.agentId ? (
              <a
                key={feature.key}
                href={featureLink}
                className="block"
              >
                {CardContent}
              </a>
            ) : (
              <div key={feature.key}>
                {CardContent}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
