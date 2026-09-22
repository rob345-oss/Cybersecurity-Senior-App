'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react'
import { cn } from '../../utils/cn'

interface HowCallGuardProtectsProps {
  className?: string
  defaultOpen?: boolean
}

export default function HowCallGuardProtects({
  className,
  defaultOpen = false,
}: HowCallGuardProtectsProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--cg-trusted-border)] bg-[var(--cg-trusted-bg)]/60 overflow-hidden',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full min-h-[48px] flex items-center justify-between gap-3 px-4 py-3 text-left text-lg font-semibold text-[var(--cg-trusted)] hover:bg-teal-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-700"
      >
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          How CallGuard protects this call
        </span>
        {open ? (
          <ChevronUp className="w-5 h-5" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-5 h-5" aria-hidden="true" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 text-lg text-[var(--cg-ink-muted)]">
          <p>CallGuard listens for common scam warning signs during the call.</p>
          <p>If something looks risky, you will see a clear warning. You always decide when to hang up.</p>
          <p>Trusted contacts get a calmer experience. Unknown numbers get an extra check before you continue.</p>
        </div>
      )}
    </div>
  )
}
