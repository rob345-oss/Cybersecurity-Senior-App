'use client'

import { cn } from '../../utils/cn'
import {
  scenarioToOverride,
  type DemoScenario,
} from './demoMode'
import type { DemoOverride } from './types'

interface CallGuardDemoControlsProps {
  scenario: DemoScenario
  onScenarioChange: (scenario: DemoScenario) => void
  className?: string
}

const SCENARIOS: Array<{ id: DemoScenario; label: string }> = [
  { id: 'off', label: 'Live / Off' },
  { id: 'trusted', label: 'Trusted' },
  { id: 'unknown', label: 'Unknown' },
  { id: 'possibleRisk', label: 'Possible risk' },
  { id: 'highRisk', label: 'High risk' },
  { id: 'escalate', label: 'Escalate mid-call' },
  { id: 'failed', label: 'Failed call' },
  { id: 'offline', label: 'Offline' },
]

/** Development-only preview controls. Never rendered in production builds. */
export default function CallGuardDemoControls({
  scenario,
  onScenarioChange,
  className,
}: CallGuardDemoControlsProps) {
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-amber-400 bg-amber-50 p-3 space-y-2',
        className
      )}
      data-testid="callguard-demo-controls"
    >
      <p className="text-sm font-semibold text-amber-900">
        Demo mode (development only)
      </p>
      <p className="text-sm text-amber-800">
        Preview CallGuard warning states without placing a real call.
      </p>
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onScenarioChange(s.id)}
            className={cn(
              'min-h-[40px] px-3 rounded-lg text-sm font-medium border',
              scenario === s.id
                ? 'bg-amber-900 text-white border-amber-900'
                : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function useDemoOverride(scenario: DemoScenario): DemoOverride {
  return scenarioToOverride(scenario)
}
