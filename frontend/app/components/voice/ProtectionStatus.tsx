'use client'

import { AlertTriangle, HelpCircle, Shield, ShieldAlert } from 'lucide-react'
import { cn } from '../../utils/cn'
import { getProtectionLabel } from './riskUi'
import type { RiskUiState } from './types'

interface ProtectionStatusProps {
  state: RiskUiState
  /** Compact chip for active call bar */
  compact?: boolean
  className?: string
  /** Show “protection active” monitoring hint */
  monitoring?: boolean
}

const stateStyles: Record<
  RiskUiState,
  { bg: string; border: string; text: string; Icon: typeof Shield }
> = {
  trusted: {
    bg: 'bg-[var(--cg-trusted-bg)]',
    border: 'border-[var(--cg-trusted-border)]',
    text: 'text-[var(--cg-trusted)]',
    Icon: Shield,
  },
  unknown: {
    bg: 'bg-[var(--cg-unknown-bg)]',
    border: 'border-[var(--cg-unknown-border)]',
    text: 'text-[var(--cg-unknown)]',
    Icon: HelpCircle,
  },
  possibleRisk: {
    bg: 'bg-[var(--cg-possible-bg)]',
    border: 'border-[var(--cg-possible-border)]',
    text: 'text-[var(--cg-possible)]',
    Icon: AlertTriangle,
  },
  highRisk: {
    bg: 'bg-[var(--cg-high-bg)]',
    border: 'border-[var(--cg-high-border)]',
    text: 'text-[var(--cg-high)]',
    Icon: ShieldAlert,
  },
}

export default function ProtectionStatus({
  state,
  compact,
  className,
  monitoring,
}: ProtectionStatusProps) {
  const style = stateStyles[state]
  const Icon = style.Icon
  const label = getProtectionLabel(state)

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex flex-col gap-1',
        className
      )}
    >
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full border font-semibold',
          style.bg,
          style.border,
          style.text,
          compact ? 'px-3 py-1.5 text-base' : 'px-4 py-2 text-lg'
        )}
      >
        <Icon
          className={cn(compact ? 'w-5 h-5' : 'w-6 h-6', 'cg-shield-animate')}
          aria-hidden="true"
        />
        {label}
      </span>
      {monitoring && (
        <span className="text-base text-[var(--cg-ink-muted)]">
          CallGuard protection is active
        </span>
      )}
    </div>
  )
}
