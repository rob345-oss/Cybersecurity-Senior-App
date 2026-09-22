'use client'

import { cn } from '../../utils/cn'

interface CallScreenShellProps {
  children: React.ReactNode
  className?: string
  /** Elevated warning atmosphere */
  tone?: 'calm' | 'caution' | 'alert'
}

const toneGlow: Record<NonNullable<CallScreenShellProps['tone']>, string> = {
  calm: 'var(--cg-glow)',
  caution:
    'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(194, 65, 12, 0.12), transparent 70%)',
  alert:
    'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(185, 28, 28, 0.14), transparent 70%)',
}

export default function CallScreenShell({
  children,
  className,
  tone = 'calm',
}: CallScreenShellProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-gray-200/80',
        'bg-[var(--cg-surface)] text-[var(--cg-ink)]',
        'shadow-[var(--cg-card-shadow)]',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: toneGlow[tone] }}
        aria-hidden="true"
      />
      <div className="relative p-5 sm:p-8 space-y-6 text-lg">{children}</div>
    </div>
  )
}
