'use client'

import { Phone } from 'lucide-react'
import { cn } from '../../utils/cn'

interface CallButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  label?: string
  className?: string
  /** Slow pulse when ready to dial */
  pulse?: boolean
}

export default function CallButton({
  onClick,
  disabled,
  loading,
  label = 'Call',
  className,
  pulse = true,
}: CallButtonProps) {
  const ready = !disabled && !loading

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={loading ? 'Calling' : label}
      className={cn(
        'w-full min-h-[56px] flex items-center justify-center gap-3 rounded-2xl text-lg font-semibold text-white transition-colors',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300',
        ready
          ? 'bg-[var(--cg-call)] hover:bg-[var(--cg-call-hover)]'
          : 'bg-gray-400 cursor-not-allowed',
        ready && pulse && 'cg-call-pulse',
        className
      )}
    >
      <Phone className="w-6 h-6" aria-hidden="true" />
      {loading ? 'Calling…' : label}
    </button>
  )
}
