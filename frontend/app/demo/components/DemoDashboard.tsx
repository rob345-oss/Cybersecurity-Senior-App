'use client'

import {
  DollarSign,
  Globe,
  Mail,
  Phone,
  Shield,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { DEMO_MODULES, type DemoModule } from '../demoData'
import FeaturePanel from './FeaturePanel'

const ICONS: Record<DemoModule['id'], LucideIcon> = {
  callguard: Phone,
  inboxguard: Mail,
  moneyguard: DollarSign,
  identitywatch: User,
  webguardian: Globe,
  carecircle: Users,
}

interface DemoDashboardProps {
  activeModuleId: string | null
  moduleActionResults: Record<string, string>
  onOpenModule: (id: string) => void
  onCloseModule: () => void
  onModuleAction: (module: DemoModule) => void
  onComplete: () => void
}

export default function DemoDashboard({
  activeModuleId,
  moduleActionResults,
  onOpenModule,
  onCloseModule,
  onModuleAction,
  onComplete,
}: DemoDashboardProps) {
  const active = DEMO_MODULES.find((m) => m.id === activeModuleId) ?? null

  return (
    <section aria-labelledby="demo-dashboard-heading" className="space-y-6">
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 text-blue-700 font-semibold text-sm mb-2">
          <Shield className="w-4 h-4" aria-hidden="true" />
          Titanium Guardian
        </div>
        <h2 id="demo-dashboard-heading" className="text-3xl font-bold text-gray-900 mb-2">
          Protection dashboard
        </h2>
        <p className="text-gray-600 max-w-2xl">
          Explore sample data for each module. Click a card for a realistic example and one
          simulated action—no production systems are connected.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {DEMO_MODULES.map((module) => {
          const Icon = ICONS[module.id]
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => onOpenModule(module.id)}
              className="text-left rounded-2xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[140px]"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-900 shrink-0">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                  <p className="text-sm text-gray-600">{module.summary}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-2">
                {module.stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-gray-50 px-2.5 py-2">
                    <dt className="text-xs text-gray-500 leading-snug">{stat.label}</dt>
                    <dd className="text-base font-semibold text-gray-900">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </button>
          )
        })}
      </div>

      {active && (
        <FeaturePanel
          module={active}
          actionResult={moduleActionResults[active.id]}
          onClose={onCloseModule}
          onAction={() => onModuleAction(active)}
        />
      )}

      <div className="flex justify-center sm:justify-start">
        <button
          type="button"
          onClick={onComplete}
          className="min-h-[48px] px-5 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Finish demo
        </button>
      </div>
    </section>
  )
}
